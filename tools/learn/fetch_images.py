#!/usr/bin/env python3
"""Step 1 of the learning loop: collect openly licensed street photos for the city box.

Sources (no field work needed):
  - Mapillary: the photos already judged by tools/scan_core.js (data/ai_scan.js), as 1024 px thumbnails.
  - Panoramax: open street-level imagery, CC-BY-SA.
  - Wikimedia Commons: geotagged photos inside the box, CC licences only.
Writes ai_cache/img/<source>_<id>.jpg and ai_cache/images.json (one row per photo with position,
time, bearing, source, author, licence). Already-downloaded photos are skipped, so re-runs are cheap.

Usage: python3 tools/learn/fetch_images.py [--limit N]   (MAPILLARY_TOKEN env var optional; falls back to index.html)
"""
import json, os, re, sys, time
import requests

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
IMG_DIR = os.path.join(ROOT, "ai_cache", "img")
MANIFEST = os.path.join(ROOT, "ai_cache", "images.json")
UA = {"User-Agent": "VadodaraAccessMap/1.0 (+https://github.com/omdorkar/vadodara-access-map)"}

def read_js(path, var):
    txt = open(os.path.join(ROOT, path), encoding="utf-8").read()
    return json.loads(txt[txt.index("{", txt.index(var)):txt.rindex("}") + 1].replace("generated:", '"generated":')
                      .replace(" city:", ' "city":').replace(" box:", ' "box":').replace(" areas:", ' "areas":').replace(" rows:", ' "rows":'))

def city():
    txt = open(os.path.join(ROOT, "data", "city.js")).read()
    m = re.search(r"box:\s*\{\s*s:\s*([\d.]+),\s*w:\s*([\d.]+),\s*n:\s*([\d.]+),\s*e:\s*([\d.]+)", txt)
    return dict(zip("swne", map(float, m.groups())))

def token():
    t = os.environ.get("MAPILLARY_TOKEN")
    if t: return t
    m = re.search(r'MAPILLARY_TOKEN\s*=\s*"([^"]+)"', open(os.path.join(ROOT, "index.html")).read())
    return m.group(1) if m else ""

def get(url, **kw):
    for i in range(3):
        try:
            r = requests.get(url, headers=UA, timeout=60, **kw)
            if r.status_code == 200: return r
            if r.status_code == 429: time.sleep(10 * (i + 1)); continue
            return None
        except requests.RequestException:
            time.sleep(3)
    return None

def save(path, url):
    if os.path.exists(path): return True
    r = get(url)
    if not r: return False
    open(path, "wb").write(r.content); return True

def mapillary(rows, tok, limit):
    out = []
    for row in rows:
        mid, lat, lng, ts, v = row[0], row[1], row[2], row[3], row[4]
        if v == "X": continue                      # dark or no road in view: nothing to learn from
        path = os.path.join(IMG_DIR, f"mapillary_{mid}.jpg")
        meta = {"id": f"mapillary_{mid}", "source": "mapillary", "source_id": mid, "lat": lat, "lng": lng, "ts": ts,
                "rule_verdict": v, "flags": row[5], "license": "CC-BY-SA 4.0",
                "page": f"https://www.mapillary.com/app/?pKey={mid}&focus=photo"}
        if not os.path.exists(path):
            r = get(f"https://graph.mapillary.com/{mid}?fields=thumb_1024_url,compass_angle,creator&access_token={tok}")
            if not r: print("mapillary meta failed", mid); continue
            j = r.json(); meta["bearing"] = j.get("compass_angle"); meta["author"] = (j.get("creator") or {}).get("username")
            if not save(path, j.get("thumb_1024_url", "")): print("mapillary image failed", mid); continue
        out.append(meta)
        if limit and len(out) >= limit: break
    return out

def panoramax(box, limit):
    out = []
    r = get(f"https://api.panoramax.xyz/api/search?bbox={box['w']},{box['s']},{box['e']},{box['n']}&limit=1000")
    for f in (r.json().get("features", []) if r else []):
        pid, p = f["id"], f["properties"]
        path = os.path.join(IMG_DIR, f"panoramax_{pid}.jpg")
        url = (f["assets"].get("sd") or f["assets"].get("thumb"))["href"]
        if not save(path, url): continue
        lng, lat = f["geometry"]["coordinates"]
        ts = int(time.mktime(time.strptime(p["datetime"][:19], "%Y-%m-%dT%H:%M:%S")) * 1000)
        out.append({"id": f"panoramax_{pid}", "source": "panoramax", "source_id": pid, "lat": lat, "lng": lng, "ts": ts,
                    "bearing": p.get("view:azimuth"), "author": p.get("providers", [{}])[0].get("name"), "license": p.get("license", "CC-BY-SA-4.0"),
                    "page": f"https://api.panoramax.xyz/#focus=pic&pic={pid}", "img_url": url})
        if limit and len(out) >= limit: break
    return out

def commons(box, limit):
    """Geotagged Commons photos: list=geosearch gives positions; imageinfo gives URL and licence."""
    out = []
    r = get("https://commons.wikimedia.org/w/api.php", params={"action": "query", "list": "geosearch", "gsbbox": f"{box['n']}|{box['w']}|{box['s']}|{box['e']}",
                                                               "gsnamespace": 6, "gslimit": 500, "format": "json"})
    hits = {str(h["pageid"]): h for h in (r.json().get("query", {}).get("geosearch", []) if r else [])}
    ids = list(hits)
    for i in range(0, len(ids), 50):
        r = get("https://commons.wikimedia.org/w/api.php", params={"action": "query", "pageids": "|".join(ids[i:i + 50]), "prop": "imageinfo",
                                                                   "iiprop": "url|extmetadata|timestamp|mime", "iiurlwidth": 1024, "format": "json"})
        for pid, pg in (r.json().get("query", {}).get("pages", {}) if r else {}).items():
            ii = (pg.get("imageinfo") or [{}])[0]; h = hits.get(pid)
            if not h or not ii.get("thumburl") or not ii.get("mime", "").startswith("image/"): continue
            em = ii.get("extmetadata", {}); lic = em.get("LicenseShortName", {}).get("value", "")
            if not lic.upper().startswith("CC") and "public domain" not in lic.lower(): continue
            path = os.path.join(IMG_DIR, f"commons_{pid}.jpg")
            if not save(path, ii["thumburl"]): continue
            ts = int(time.mktime(time.strptime(ii["timestamp"][:19], "%Y-%m-%dT%H:%M:%S")) * 1000)
            author = re.sub("<[^>]+>", "", em.get("Artist", {}).get("value", ""))[:100]
            out.append({"id": f"commons_{pid}", "source": "commons", "source_id": pid, "lat": h["lat"], "lng": h["lon"], "ts": ts,
                        "bearing": None, "author": author, "license": lic, "page": ii.get("descriptionurl"), "title": pg.get("title"), "img_url": ii["thumburl"]})
            if limit and len(out) >= limit: return out
        time.sleep(1)
    return out

if __name__ == "__main__":
    limit = int(sys.argv[sys.argv.index("--limit") + 1]) if "--limit" in sys.argv else 0
    os.makedirs(IMG_DIR, exist_ok=True)
    box = city()
    scan = read_js("data/ai_scan.js", "AI_SCAN")
    rows = mapillary(scan["rows"], token(), limit); print("mapillary", len(rows))
    p = panoramax(box, limit); print("panoramax", len(p))
    c = commons(box, limit); print("commons", len(c))
    json.dump(rows + p + c, open(MANIFEST, "w"), indent=0)
    print("total", len(rows) + len(p) + len(c), "->", MANIFEST)
