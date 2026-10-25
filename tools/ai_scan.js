// AI street scan: uses Mapillary's computer vision to judge, photo by photo, whether a street has a footpath.
// macOS only, no installs (JXA + curl).
// Usage (from the project folder):
//   osascript -l JavaScript tools/ai_scan.js "$PWD"
// Reads   the Mapillary token from index.html (MAPILLARY_TOKEN).
// Fetches every Mapillary image in the city box, then each image's detections (semantic segmentation
//         by Mapillary: road, sidewalk, curb, crosswalk, pothole, building...). Detections are cached in
//         ai_cache/ (not published), so re-runs only fetch new images.
// Writes  data/ai_scan.js: one row per photo with a verdict. Images are NOT copied; the map loads them live.
ObjC.import('Foundation');
const app = Application.currentApplication(); app.includeStandardAdditions = true;

// Vadodara and near outskirts (same as CITY in index.html).
const BOX = { s:22.24, w:73.10, n:22.40, e:73.27 };
const STEP = 0.05;   // Mapillary allows at most 0.01 square degrees per image search

function readText(p){ const s = $.NSString.stringWithContentsOfFileEncodingError(p, $.NSUTF8StringEncoding, null); return s.isNil() ? null : s.js; }
function writeText(p, t){ $(t).writeToFileAtomicallyEncodingError(p, true, $.NSUTF8StringEncoding, null); }
function curlJson(url){
  try { return JSON.parse(app.doShellScript("curl -s --max-time 40 -A 'VadodaraAccessMap/1.0 (+https://github.com/omdorkar/vadodara-access-map)' " + quoted(url))); } catch(e) { return null; }
}
function quoted(s){ return "'" + String(s).replace(/'/g, "'\\''") + "'"; }

// Street (and neighbourhood) name for a ~200 m cell, from OpenStreetMap's Nominatim (cached; max 1 request per second, identified).
const CELL = 0.002;   // about 200 m
let lastLookup = 0;
// Named places from OpenStreetMap, used when a street has no name: "near <place>".
let PLACES = [];
function loadPlaces(cacheDir){
  const file = cacheDir + "/places.json";
  let j = null; try { j = JSON.parse(readText(file) || "null"); } catch(e) {}
  if (!j) {
    const q = '[out:json][timeout:60];node["place"~"^(suburb|neighbourhood|quarter|village|hamlet|town)$"](' + [BOX.s,BOX.w,BOX.n,BOX.e].join(",") + ');out;';
    try { j = JSON.parse(app.doShellScript("curl -s --max-time 90 -A 'VadodaraAccessMap/1.0 (+https://github.com/omdorkar/vadodara-access-map)' --data-urlencode " + quoted("data=" + q) + " https://overpass-api.de/api/interpreter")); } catch(e) { j = null; }
    if (j) writeText(file, JSON.stringify(j));
  }
  PLACES = ((j && j.elements) || []).filter(e => e.tags && e.tags.name).map(e => ({ name:e.tags["name:en"] || e.tags.name, lat:e.lat, lng:e.lon }));
}
function nearestPlace(lat, lng){
  let best = null, bd = 1e9;
  PLACES.forEach(p => { const dy = (p.lat-lat)*111, dx = (p.lng-lng)*102, d = Math.sqrt(dx*dx+dy*dy); if (d < bd) { bd = d; best = p; } });
  return best && bd < 8 ? "near " + best.name : "";
}
function areaName(lat, lng, cacheFile, areaCache){
  const key = (Math.round(lat/CELL)*CELL).toFixed(3) + "," + (Math.round(lng/CELL)*CELL).toFixed(3);
  if (areaCache[key] !== undefined) return areaCache[key];
  const wait = 1.1 - (Date.now() - lastLookup) / 1000;
  if (wait > 0) delay(wait);
  lastLookup = Date.now();
  const [la, lo] = key.split(",");
  const j = curlJson("https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&addressdetails=1&lat=" + la + "&lon=" + lo);
  const ad = (j && j.address) || {};
  const road = ad.road || "", place = ad.suburb || ad.neighbourhood || ad.quarter || ad.village || ad.town || "";
  const name = road && place ? road + ", " + place : (road || place || nearestPlace(+la, +lo));
  if (j) { areaCache[key] = name; writeText(cacheFile, JSON.stringify(areaCache)); }
  return name;
}

// India is UTC+5:30. Photos taken in the dark are not judged: the model is unreliable at night.
function localHour(ts){ const d = new Date(ts); return (d.getUTCHours() + d.getUTCMinutes()/60 + 5.5) % 24; }

// The rules. Kept deliberately simple so anyone can check them.
//   F = footpath detected (sidewalk or pedestrian area in the photo)
//   N = built-up street (3+ building detections, not a flyover or highway with guard rails) with no footpath detected
//   O = open road or highway with no footpath detected (not counted as a barrier)
//   X = not judged (night, or no road in view)
// Flags: c = zebra crossing detected (check it for a kerb ramp), k = kerb cut detected, p = pothole detected
function judge(values, ts){
  const has = k => values.some(v => v.indexOf(k) === 0);
  const count = k => values.filter(v => v.indexOf(k) === 0).length;
  const h = localHour(ts);
  let flags = "";
  if (has("marking--discrete--crosswalk") || has("construction--flat--crosswalk")) flags += "c";
  if (has("construction--flat--curb-cut")) flags += "k";
  if (has("object--pothole")) flags += "p";
  if (h >= 18.75 || h < 6.5 || !has("construction--flat--road")) return { v:"X", flags };
  if (has("construction--flat--sidewalk") || has("construction--flat--pedestrian-area")) return { v:"F", flags };
  const builtUp = count("construction--structure--building") >= 3 && !has("construction--structure--bridge") && !has("construction--barrier--guard-rail");
  return { v: builtUp ? "N" : "O", flags };
}

function run(argv){
  const root = argv[0];
  if (!root) return 'Usage: osascript -l JavaScript tools/ai_scan.js "$PWD"';
  const html = readText(root + "/index.html") || "";
  const m = /MAPILLARY_TOKEN = "([^"]+)"/.exec(html);
  if (!m) return "No MAPILLARY_TOKEN found in index.html.";
  const token = encodeURIComponent(m[1]);
  const cache = root + "/ai_cache";
  $.NSFileManager.defaultManager.createDirectoryAtPathWithIntermediateDirectoriesAttributesError(cache, true, $(), null);

  // 1. All images in the box, cell by cell.
  const images = {}, errors = [];
  for (let s = BOX.s; s < BOX.n - 1e-9; s += STEP)
    for (let w = BOX.w; w < BOX.e - 1e-9; w += STEP) {
      const bbox = [w, s, Math.min(w+STEP, BOX.e), Math.min(s+STEP, BOX.n)].map(n => n.toFixed(5)).join(",");
      const j = curlJson("https://graph.mapillary.com/images?fields=id,geometry,captured_at&limit=2000&bbox=" + bbox + "&access_token=" + token);
      if (!j || !j.data) { errors.push("image search failed for " + bbox); continue; }
      j.data.forEach(d => { if (d.geometry) images[d.id] = d; });
    }

  // 2. Detections per image (cached).
  loadPlaces(cache);
  const areaFile = cache + "/areas.json";
  let areaCache = {}; try { areaCache = JSON.parse(readText(areaFile) || "{}"); } catch(e) {}
  const areas = [], areaIndex = {};
  const rows = [], tally = { F:0, N:0, O:0, X:0, c:0, k:0, p:0 };
  let fetched = 0;
  Object.keys(images).sort().forEach(id => {
    const d = images[id], file = cache + "/" + id + ".json";
    let raw = readText(file);
    if (!raw) {
      const j = curlJson("https://graph.mapillary.com/" + id + "/detections?fields=value&limit=1000&access_token=" + token);
      if (!j || !j.data) { errors.push("detections failed for " + id); return; }
      raw = JSON.stringify(j.data.map(x => x.value)); writeText(file, raw); fetched++;
    }
    let values; try { values = JSON.parse(raw); } catch(e) { return; }
    const r = judge(values, d.captured_at);
    tally[r.v]++; r.flags.split("").forEach(f => tally[f]++);
    const [lng, lat] = d.geometry.coordinates;
    let ai = -1;
    if (r.v !== "X") {
      const name = areaName(lat, lng, areaFile, areaCache) || "Unnamed area";
      if (areaIndex[name] === undefined) { areaIndex[name] = areas.length; areas.push(name); }
      ai = areaIndex[name];
    }
    rows.push([id, Math.round(lat*1e6)/1e6, Math.round(lng*1e6)/1e6, d.captured_at, r.v, r.flags, ai]);
  });

  writeText(root + "/data/ai_scan.js",
    "// AI street scan. Generated by tools/ai_scan.js from Mapillary's own computer-vision detections. Do not edit by hand.\n" +
    "// Row: [mapillary image id, lat, lng, captured_at (ms), verdict, flags, area index into areas (-1 if not judged)]\n" +
    "// verdict: F footpath detected | N built-up street, no footpath detected | O open road, no footpath detected | X not judged\n" +
    "// flags: c zebra crossing (check for kerb ramp) | k kerb cut | p pothole\n" +
    "window.AI_SCAN = { generated:" + JSON.stringify(new Date().toISOString()) + ", box:" + JSON.stringify(BOX) + ", areas:" + JSON.stringify(areas) + ", rows:" + JSON.stringify(rows) + " };\n");

  const judged = tally.F + tally.N + tally.O;
  return [
    "Images: " + rows.length + " (" + fetched + " newly fetched).",
    "Judged: " + judged + ". Footpath detected " + tally.F + ", built-up street with no footpath " + tally.N + ", open road " + tally.O + ", not judged " + tally.X + ".",
    "Areas: " + areas.length + ". Zebra crossings " + tally.c + ", kerb cuts " + tally.k + ", potholes " + tally.p + ".",
    errors.length ? "Errors (" + errors.length + "):\n  " + errors.slice(0, 10).join("\n  ") : ""
  ].filter(Boolean).join("\n");
}
