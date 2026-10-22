// Turns field-survey photos into web images + data/survey.js. macOS only, no installs.
// Usage (from the project folder):
//   osascript -l JavaScript tools/process_photos.js "$PWD" ["Photo credit name", default Om Dorkar]
// Reads   photos/originals/*.{jpg,jpeg,heic,png}  and optional photos/notes.csv (file,type,severity,note)
// Writes  photos/web/<name>.jpg (1280px) and <name>-thumb.jpg (320px), both with all metadata removed,
//         and data/survey.js. Existing type/severity/note values in data/survey.js are kept on re-runs.
//         Each located photo also gets a street name from OpenStreetMap's Nominatim (kept on re-runs; edit by hand if wrong).
ObjC.import('Foundation'); ObjC.import('ImageIO');

const app = Application.currentApplication(); app.includeStandardAdditions = true;
let lastLookup = 0;
// Street and area names for a point, via Nominatim (max 1 request per second, identified, per its usage policy).
function lookupStreet(lat, lng){
  const wait = 1.1 - (Date.now() - lastLookup) / 1000;
  if (wait > 0) delay(wait);
  lastLookup = Date.now();
  try {
    const out = app.doShellScript("curl -s --max-time 20 -A 'VadodaraAccessMap/1.0 (+https://github.com/omdorkar/vadodara-access-map)' " +
      "'https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&lat=" + Number(lat).toFixed(6) + "&lon=" + Number(lng).toFixed(6) + "'");
    const a = JSON.parse(out).address || {};
    return { street: a.road || a.pedestrian || a.footway || "", area: a.suburb || a.neighbourhood || a.quarter || "" };
  } catch(e) { return null; }
}

const CATS = ["broken_ramp","missing_ramp","obstacle","uneven","no_tactile","stairs_only","lighting"];
const SEVS = ["high","med","low"];

function readText(p){
  const s = $.NSString.stringWithContentsOfFileEncodingError(p, $.NSUTF8StringEncoding, null);
  return s.isNil() ? null : s.js;
}
function writeText(p, t){
  $(t).writeToFileAtomicallyEncodingError(p, true, $.NSUTF8StringEncoding, null);
}
function listDir(p){
  const a = $.NSFileManager.defaultManager.contentsOfDirectoryAtPathError(p, null);
  return a.isNil() ? [] : ObjC.deepUnwrap(a).sort();
}

function readMeta(src){
  // ImageIO returns a CFDictionary; cast it before unwrapping or every key comes back empty.
  const props = ObjC.deepUnwrap(ObjC.castRefToObject($.CGImageSourceCopyPropertiesAtIndex(src, 0, $())));
  const gps = (props && props["{GPS}"]) || {};
  const exif = (props && props["{Exif}"]) || {};
  let lat = null, lng = null;
  const la = parseFloat(gps.Latitude), lo = parseFloat(gps.Longitude);
  if (isFinite(la) && isFinite(lo) && !(la === 0 && lo === 0)) {
    lat = la * (gps.LatitudeRef === "S" ? -1 : 1);
    lng = lo * (gps.LongitudeRef === "W" ? -1 : 1);
    lat = Math.round(lat*1e6)/1e6; lng = Math.round(lng*1e6)/1e6;
  }
  let ts = null;
  const m = /^(\d{4}):(\d\d):(\d\d) (\d\d):(\d\d):(\d\d)/.exec(exif.DateTimeOriginal || "");
  if (m) ts = new Date(+m[1], m[2]-1, +m[3], +m[4], +m[5], +m[6]).getTime();
  return { lat, lng, ts };
}

// Re-encode upright (EXIF orientation applied) at a max size, with no metadata attached.
function writeResized(src, outPath, maxPx){
  const opts = $.NSDictionary.dictionaryWithDictionary({
    kCGImageSourceCreateThumbnailFromImageAlways: true,
    kCGImageSourceCreateThumbnailWithTransform: true,
    kCGImageSourceThumbnailMaxPixelSize: maxPx
  });
  const img = $.CGImageSourceCreateThumbnailAtIndex(src, 0, opts);
  if (!img) return false;
  const dest = $.CGImageDestinationCreateWithURL($.NSURL.fileURLWithPath(outPath), $("public.jpeg"), 1, $());
  const q = $.NSDictionary.dictionaryWithDictionary({ kCGImageDestinationLossyCompressionQuality: 0.8 });
  $.CGImageDestinationAddImage(dest, img, q);
  return $.CGImageDestinationFinalize(dest);
}

function parseNotes(text){
  const out = {};
  (text || "").split(/\r?\n/).slice(1).forEach(line => {
    if (!line.trim()) return;
    const parts = line.split(",");
    const file = (parts[0]||"").trim().toLowerCase();
    if (!file) return;
    out[file] = { cat:(parts[1]||"").trim(), sev:(parts[2]||"").trim().toLowerCase(),
                  desc: parts.slice(3).join(",").trim().replace(/^"|"$/g, "") };
  });
  return out;
}

function run(argv){
  const root = argv[0], credit = argv[1] || "Om Dorkar";
  if (!root) return "Usage: osascript -l JavaScript tools/process_photos.js \"$PWD\" \"Photo credit name\"";
  const orig = root + "/photos/originals", web = root + "/photos/web", outJs = root + "/data/survey.js";
  $.NSFileManager.defaultManager.createDirectoryAtPathWithIntermediateDirectoriesAttributesError(web, true, $(), null);

  const prev = {};
  const old = readText(outJs);
  const mm = old && /window\.SURVEY\s*=\s*(\[[\s\S]*\]);?/.exec(old);
  if (mm) { try { JSON.parse(mm[1]).forEach(r => { if (r.file) prev[r.file.toLowerCase()] = r; }); } catch(e){} }
  const notes = parseNotes(readText(root + "/photos/notes.csv"));

  const files = listDir(orig).filter(f => /\.(jpe?g|heic|png)$/i.test(f));
  const records = [], noGps = [], warnings = [];
  files.forEach(f => {
    const src = $.CGImageSourceCreateWithURL($.NSURL.fileURLWithPath(orig + "/" + f), $());
    if (!src) { warnings.push(f + ": could not read image"); return; }
    const meta = readMeta(src);
    const base = f.replace(/\.[^.]+$/, "").replace(/[^A-Za-z0-9_-]+/g, "_");
    if (!writeResized(src, web + "/" + base + ".jpg", 1280) || !writeResized(src, web + "/" + base + "-thumb.jpg", 320))
      warnings.push(f + ": could not write web copy");
    const key = f.toLowerCase(), n = notes[key] || {}, p = prev[key] || {};
    const pick = k => n[k] || p[k] || "";
    const r = {
      file: f,
      lat: meta.lat, lng: meta.lng, ts: meta.ts,
      cat: pick("cat"), sev: pick("sev"), desc: pick("desc"),
      photo: "photos/web/" + base + ".jpg", thumb: "photos/web/" + base + "-thumb.jpg",
      credit: p.credit || credit, license: "CC-BY-SA 4.0"
    };
    // Manual placement for photos without GPS: set lat/lng by hand in data/survey.js; it is kept on re-runs.
    if (r.lat === null && typeof p.lat === "number") { r.lat = p.lat; r.lng = p.lng; r.placed = "manual"; }
    if (r.lat === null) noGps.push(f);
    // Hand-added detail answers, e.g. "tags": {"kerb": "raised"}, are kept on re-runs.
    if (p.tags && typeof p.tags === "object") r.tags = p.tags;
    if (p.street || p.area) { r.street = p.street || ""; r.area = p.area || ""; }
    else if (r.lat !== null) {
      const s = lookupStreet(r.lat, r.lng);
      if (s) { r.street = s.street; r.area = s.area; } else warnings.push(f + ": street name lookup failed (will retry next run)");
    }
    if (r.cat && CATS.indexOf(r.cat) < 0) warnings.push(f + ": unknown type '" + r.cat + "'");
    if (r.sev && SEVS.indexOf(r.sev) < 0) warnings.push(f + ": unknown severity '" + r.sev + "'");
    records.push(r);
  });

  writeText(outJs,
    "// Field survey records. Generated by tools/process_photos.js; edit cat/sev/desc by hand if needed (kept on re-runs).\n" +
    "// cat: " + CATS.join(" | ") + "    sev: high | med | low\n" +
    "window.SURVEY = " + JSON.stringify(records, null, 2) + ";\n");

  const located = records.filter(r => r.lat !== null).length;
  const blank = records.filter(r => !r.cat || !r.sev).length;
  return [
    "Processed " + records.length + " photo(s): " + located + " with location, " + noGps.length + " without.",
    noGps.length ? "No GPS (not shown on map until lat/lng added by hand): " + noGps.join(", ") : "",
    blank ? blank + " record(s) still need a type/severity (shown as 'not recorded')." : "",
    warnings.length ? "Warnings:\n  " + warnings.join("\n  ") : ""
  ].filter(Boolean).join("\n");
}
