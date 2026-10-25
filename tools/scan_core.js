// AI street scan: the shared engine. Used by tools/ai_scan.js (Mac, JXA) and tools/ai_scan_node.js (GitHub Action).
// It has no I/O of its own: the caller passes an `io` object, so the same rules run everywhere.
//
// Pipeline
//   1. List every Mapillary image in the city box.
//   2. For each image, get Mapillary's computer-vision labels (road, sidewalk, curb, crosswalk, building...).
//   3. Judge each photo with a simple rule (judge below).
//   4. Name the area of each judged photo (OpenStreetMap Nominatim, nearest named place as fallback).
//   5. Snap judged photos onto OpenStreetMap roads, so whole stretches of street get a colour.
//   6. Write data/ai_scan.js (one row per photo) and data/ai_streets.js (coloured road stretches).
(function (root) {
  "use strict";
  const UA = "VadodaraAccessMap/1.0 (+https://github.com/omdorkar/vadodara-access-map)";
  const STEP = 0.05;       // Mapillary allows at most 0.01 square degrees per image search
  const CELL = 0.002;      // about 200 m, for area names
  const SNAP_M = 25;       // a photo colours the road within this distance
  const PIECE_M = 50;      // roads are split into pieces of at most this length
  const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
  const ROADS = "^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service)(_link)?$";

  // ---------- The rule. Kept deliberately simple so anyone can check it. ----------
  //   F = footpath detected (sidewalk or pedestrian area in the photo)
  //   N = built-up street (3+ building labels, no flyover or guard rail) with no footpath detected
  //   O = open road or highway with no footpath detected (not counted as a barrier)
  //   X = not judged (taken in the dark, or no road in view)
  // Flags: c = zebra crossing (check it for a kerb ramp), k = kerb cut, p = pothole
  function judge(values, ts, utcOffsetHours) {
    const has = k => values.some(v => v.indexOf(k) === 0);
    const count = k => values.filter(v => v.indexOf(k) === 0).length;
    const d = new Date(ts);
    const h = (d.getUTCHours() + d.getUTCMinutes() / 60 + utcOffsetHours + 24) % 24;
    let flags = "";
    if (has("marking--discrete--crosswalk") || has("construction--flat--crosswalk")) flags += "c";
    if (has("construction--flat--curb-cut")) flags += "k";
    if (has("object--pothole")) flags += "p";
    if (h >= 18.75 || h < 6.5 || !has("construction--flat--road")) return { v: "X", flags };
    if (has("construction--flat--sidewalk") || has("construction--flat--pedestrian-area")) return { v: "F", flags };
    const builtUp = count("construction--structure--building") >= 3 && !has("construction--structure--bridge") && !has("construction--barrier--guard-rail");
    return { v: builtUp ? "N" : "O", flags };
  }

  // ---------- Geometry (local flat-earth approximation; fine at street scale) ----------
  function toXY(lat, lng, lat0) { return [lng * 111320 * Math.cos(lat0 * Math.PI / 180), lat * 110540]; }
  function distPointSeg(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy;
    let t = L2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2 : 0;
    t = Math.max(0, Math.min(1, t));
    const x = a[0] + t * dx - p[0], y = a[1] + t * dy - p[1];
    return Math.sqrt(x * x + y * y);
  }
  function lenM(a, b, lat0) { const A = toXY(a[0], a[1], lat0), B = toXY(b[0], b[1], lat0); return Math.hypot(B[0] - A[0], B[1] - A[1]); }

  // Split a way into pieces of at most PIECE_M metres. Each piece is a list of [lat,lng].
  function splitWay(coords, lat0) {
    const pieces = []; let cur = [coords[0]], curLen = 0;
    for (let i = 1; i < coords.length; i++) {
      let a = coords[i - 1]; const b = coords[i];
      let segLen = lenM(a, b, lat0);
      while (curLen + segLen > PIECE_M) {
        const f = (PIECE_M - curLen) / segLen;
        const m = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
        cur.push(m); pieces.push(cur);
        cur = [m]; curLen = 0; a = m; segLen = lenM(a, b, lat0);
      }
      cur.push(b); curLen += segLen;
    }
    if (cur.length > 1) pieces.push(cur);
    return pieces;
  }

  // Snap photos to road pieces and merge neighbouring pieces with the same verdict.
  function snapToRoads(photos, ways, lat0) {
    const pieces = [];
    ways.forEach(w => splitWay(w.coords, lat0).forEach((c, i) => pieces.push({ way: w, idx: i, coords: c, xy: c.map(p => toXY(p[0], p[1], lat0)), F: 0, N: 0, O: 0, ids: [] })));
    // Spatial grid for speed.
    const G = 100, grid = {};
    const key = (x, y) => Math.floor(x / G) + ":" + Math.floor(y / G);
    pieces.forEach((pc, n) => { const seen = {}; pc.xy.forEach(p => { const k = key(p[0], p[1]); if (!seen[k]) { seen[k] = 1; (grid[k] = grid[k] || []).push(n); } }); });
    photos.forEach(ph => {
      const p = toXY(ph.lat, ph.lng, lat0), gx = Math.floor(p[0] / G), gy = Math.floor(p[1] / G);
      let best = -1, bd = SNAP_M;
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) (grid[(gx + i) + ":" + (gy + j)] || []).forEach(n => {
        const xy = pieces[n].xy;
        for (let s = 1; s < xy.length; s++) { const d = distPointSeg(p, xy[s - 1], xy[s]); if (d < bd) { bd = d; best = n; } }
      });
      if (best >= 0) { pieces[best][ph.v]++; pieces[best].ids.push(ph.id); }
    });
    // Verdict per piece, then merge consecutive pieces of one way with the same verdict.
    const streets = [];
    const byWay = {};
    pieces.forEach(pc => { if (pc.F + pc.N + pc.O === 0) return; pc.v = pc.F + pc.N ? (pc.F >= pc.N ? "F" : "N") : "O"; (byWay[pc.way.id] = byWay[pc.way.id] || []).push(pc); });
    Object.keys(byWay).forEach(id => {
      const list = byWay[id].sort((a, b) => a.idx - b.idx);
      let run = null;
      list.forEach(pc => {
        if (run && run.v === pc.v && pc.idx === run.lastIdx + 1) { run.coords = run.coords.concat(pc.coords.slice(1)); run.n += pc.ids.length; run.ids = run.ids.concat(pc.ids); run.lastIdx = pc.idx; }
        else { if (run) streets.push(run); run = { v: pc.v, way: pc.way, coords: pc.coords.slice(), n: pc.ids.length, ids: pc.ids.slice(), lastIdx: pc.idx }; }
      });
      if (run) streets.push(run);
    });
    return streets.map(s => {
      let m = 0; for (let i = 1; i < s.coords.length; i++) m += lenM(s.coords[i - 1], s.coords[i], lat0);
      return [s.v, s.way.name, s.way.highway, Math.round(m), s.n, s.ids[0], s.coords.map(p => [Math.round(p[0] * 1e6) / 1e6, Math.round(p[1] * 1e6) / 1e6])];
    });
  }

  // ---------- The pipeline ----------
  function run(io, cfg) {
    const box = cfg.box, tz = cfg.utcOffsetHours;
    const token = encodeURIComponent(io.token);
    const cacheDir = "ai_cache";
    const errors = [];
    // Overpass servers are often busy: try each server twice, 10 s apart. Callers have a fallback.
    const overpass = q => {
      for (let attempt = 0; attempt < 2; attempt++) {
        for (const url of OVERPASS) { const j = io.postForm(url, q); if (j && j.elements) return j; }
        if (attempt < 1) io.sleep(10);
      }
      return null;
    };
    // Fallback for roads: the main OpenStreetMap API, one small box at a time (allowed for light use).
    const roadRe = new RegExp(ROADS);
    const osmApiRoads = (s, w, n, e) => {
      const j = io.getJson("https://api.openstreetmap.org/api/0.6/map.json?bbox=" + [w, s, e, n].map(x => x.toFixed(5)).join(","));
      if (!j || !j.elements) return null;
      const nodes = {}; j.elements.forEach(x => { if (x.type === "node") nodes[x.id] = [x.lat, x.lon]; });
      return j.elements.filter(x => x.type === "way" && x.tags && roadRe.test(x.tags.highway || "")).map(x => ({
        id: x.id, name: x.tags.name || x.tags.ref || "", highway: x.tags.highway,
        coords: (x.nodes || []).map(id => nodes[id]).filter(Boolean)
      })).filter(x => x.coords.length > 1);
    };
    const readJson = (p, d) => { try { const t = io.read(p); return t ? JSON.parse(t) : d; } catch (e) { return d; } };

    // 1. Images, cell by cell.
    const images = {};
    for (let s = box.s; s < box.n - 1e-9; s += STEP)
      for (let w = box.w; w < box.e - 1e-9; w += STEP) {
        const bbox = [w, s, Math.min(w + STEP, box.e), Math.min(s + STEP, box.n)].map(n => n.toFixed(5)).join(",");
        const j = io.getJson("https://graph.mapillary.com/images?fields=id,geometry,captured_at&limit=2000&bbox=" + bbox + "&access_token=" + token);
        if (!j || !j.data) { errors.push("image search failed for " + bbox); continue; }
        if (j.data.length >= 2000) errors.push("cell " + bbox + " hit the 2000-image limit; some photos were skipped");
        j.data.forEach(d => { if (d.geometry) images[d.id] = d; });
      }

    // 2-3. Detections (cached) and verdicts.
    let fetched = 0;
    const photos = [];
    Object.keys(images).sort().forEach(id => {
      const d = images[id], file = cacheDir + "/" + id + ".json";
      let values = readJson(file, null);
      if (!values) {
        const j = io.getJson("https://graph.mapillary.com/" + id + "/detections?fields=value&limit=1000&access_token=" + token);
        if (!j || !j.data) { errors.push("detections failed for " + id); return; }
        values = j.data.map(x => x.value); io.write(file, JSON.stringify(values)); fetched++;
      }
      const r = judge(values, d.captured_at, tz);
      const c = d.geometry.coordinates;
      photos.push({ id, lat: Math.round(c[1] * 1e6) / 1e6, lng: Math.round(c[0] * 1e6) / 1e6, ts: d.captured_at, v: r.v, flags: r.flags });
    });
    const judged = photos.filter(p => p.v !== "X");

    // 4. Area names.
    const placesFile = cacheDir + "/places.json";
    let placesJson = readJson(placesFile, null);
    if (!placesJson) {
      placesJson = overpass('[out:json][timeout:90];node["place"~"^(suburb|neighbourhood|quarter|village|hamlet|town)$"](' + [box.s, box.w, box.n, box.e].join(",") + ');out;');
      if (placesJson) io.write(placesFile, JSON.stringify(placesJson)); else errors.push("place names failed");
    }
    const places = ((placesJson && placesJson.elements) || []).filter(e => e.tags && e.tags.name).map(e => ({ name: e.tags["name:en"] || e.tags.name, lat: e.lat, lng: e.lon }));
    const nearestPlace = (lat, lng) => {
      let best = null, bd = 1e9;
      places.forEach(p => { const d = Math.hypot((p.lat - lat) * 111, (p.lng - lng) * 102); if (d < bd) { bd = d; best = p; } });
      return best && bd < 8 ? "near " + best.name : "";
    };
    const areaFile = cacheDir + "/areas.json";
    const areaCache = readJson(areaFile, {});
    let lastLookup = 0;
    const areas = [], areaIndex = {};
    judged.forEach(p => {
      const key = (Math.round(p.lat / CELL) * CELL).toFixed(3) + "," + (Math.round(p.lng / CELL) * CELL).toFixed(3);
      if (!areaCache[key]) {
        const wait = 1.1 - (io.now() - lastLookup) / 1000; if (wait > 0) io.sleep(wait);
        lastLookup = io.now();
        const ll = key.split(",");
        const j = io.getJson("https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&addressdetails=1&lat=" + ll[0] + "&lon=" + ll[1]);
        const ad = (j && j.address) || {};
        const road = ad.road || "", place = ad.suburb || ad.neighbourhood || ad.quarter || ad.village || ad.town || "";
        const name = road && place ? road + ", " + place : (road || place || nearestPlace(+ll[0], +ll[1]));
        if (j && name) { areaCache[key] = name; io.write(areaFile, JSON.stringify(areaCache)); }
      }
      const name = areaCache[key] || nearestPlace(p.lat, p.lng) || "Unnamed area";
      if (areaIndex[name] === undefined) { areaIndex[name] = areas.length; areas.push(name); }
      p.area = areaIndex[name];
    });

    // 5. Roads near judged photos, in batches of small boxes around each 200 m cell.
    const cells = {};
    judged.forEach(p => { cells[(Math.round(p.lat / CELL) * CELL).toFixed(3) + "," + (Math.round(p.lng / CELL) * CELL).toFixed(3)] = 1; });
    const cellKeys = Object.keys(cells), ways = {};
    for (let i = 0; i < cellKeys.length; i += 40) {
      const parts = cellKeys.slice(i, i + 40).map(k => {
        const ll = k.split(",").map(Number), pad = 0.0016;
        return 'way["highway"~"' + ROADS + '"](' + [ll[0] - pad, ll[1] - pad, ll[0] + pad, ll[1] + pad].map(n => n.toFixed(5)).join(",") + ");";
      }).join("");
      const j = overpass("[out:json][timeout:120];(" + parts + ");out tags geom;");
      if (!j || !j.elements) {
        // Overpass is down: fetch each cell from the OpenStreetMap API instead.
        cellKeys.slice(i, i + 40).forEach(k => {
          const ll = k.split(",").map(Number), pad = 0.0016;
          io.sleep(1);
          const got = osmApiRoads(ll[0] - pad, ll[1] - pad, ll[0] + pad, ll[1] + pad);
          if (!got) { errors.push("road lookup failed for cell " + k); return; }
          got.forEach(wy => { ways[wy.id] = wy; });
        });
        continue;
      }
      j.elements.forEach(e => { if (e.geometry && e.geometry.length > 1) ways[e.id] = { id: e.id, name: (e.tags && (e.tags.name || e.tags.ref)) || "", highway: (e.tags && e.tags.highway) || "", coords: e.geometry.map(g => [g.lat, g.lon]) }; });
    }
    const lat0 = (box.s + box.n) / 2;
    const streets = snapToRoads(judged, Object.keys(ways).map(k => ways[k]), lat0);

    // 6. Write.
    const now = new Date(io.now()).toISOString();
    const tally = { F: 0, N: 0, O: 0, X: 0, c: 0, k: 0, p: 0 };
    photos.forEach(p => { tally[p.v]++; p.flags.split("").forEach(f => tally[f]++); });
    const km = { F: 0, N: 0, O: 0 };
    streets.forEach(s => { km[s[0]] += s[3] / 1000; });
    Object.keys(km).forEach(k => { km[k] = Math.round(km[k] * 10) / 10; });
    io.write("data/ai_scan.js",
      "// AI street scan, one row per photo. Generated by tools/scan_core.js from Mapillary's own computer-vision detections. Do not edit by hand.\n" +
      "// Row: [mapillary image id, lat, lng, captured_at (ms), verdict, flags, area index into areas (-1 if not judged)]\n" +
      "// verdict: F footpath detected | N built-up street, no footpath detected | O open road, no footpath detected | X not judged\n" +
      "// flags: c zebra crossing (check for kerb ramp) | k kerb cut | p pothole\n" +
      "window.AI_SCAN = { generated:" + JSON.stringify(now) + ", city:" + JSON.stringify(cfg.name) + ", box:" + JSON.stringify(box) +
      ", areas:" + JSON.stringify(areas) +
      ", rows:" + JSON.stringify(photos.map(p => [p.id, p.lat, p.lng, p.ts, p.v, p.flags, p.area === undefined ? -1 : p.area])) + " };\n");
    io.write("data/ai_streets.js",
      "// AI street scan snapped onto OpenStreetMap roads. Generated by tools/scan_core.js. Do not edit by hand.\n" +
      "// A road stretch is coloured only where a judged photo lies within " + SNAP_M + " m of it.\n" +
      "// Row: [verdict F|N|O, road name or ref, OSM highway type, length (m), photos, one Mapillary image id, [[lat,lng],...]]\n" +
      "window.AI_STREETS = { generated:" + JSON.stringify(now) + ", km:" + JSON.stringify(km) + ", rows:" + JSON.stringify(streets) + " };\n");

    return [
      "Images: " + photos.length + " (" + fetched + " newly fetched).",
      "Judged: " + judged.length + ". Footpath " + tally.F + ", built-up no footpath " + tally.N + ", open road " + tally.O + ", not judged " + tally.X + ".",
      "Areas: " + areas.length + ". Crossings " + tally.c + ", kerb cuts " + tally.k + ", potholes " + tally.p + ".",
      "Streets: " + streets.length + " stretches; km with footpath " + km.F + ", without " + km.N + ", open road " + km.O + ".",
      errors.length ? "Errors (" + errors.length + "):\n  " + errors.slice(0, 15).join("\n  ") : ""
    ].filter(Boolean).join("\n");
  }

  root.SCAN_CORE = { judge, snapToRoads, run, UA };
  if (typeof module !== "undefined" && module.exports) module.exports = root.SCAN_CORE;
})(this);
