#!/usr/bin/env python3
"""Step 4 of the learning loop: publish the open dataset for the city, disability groups and OSM mappers.

Writes dataset/ (committed, CC-BY-SA 4.0):
  barriers.csv       every field-survey record and every human-confirmed (gold) photo label, one row each
  barriers.geojson   the same as GeoJSON for QGIS, uMap, Felt, etc.
  proposals.csv      every AI proposal with its scores and vote count, so anyone can audit the detector
  maproulette.geojson  confirmed barriers as a MapRoulette challenge (upload at maproulette.org -> Create challenge
                       -> Local GeoJSON) so OpenStreetMap mappers can add kerb / wheelchair / tactile_paving tags
"""
import csv, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import ROOT, MANIFEST, load_gold

OUT = os.path.join(ROOT, "dataset")
OSM_HINT = {"missing_ramp": "kerb=raised", "broken_ramp": "kerb=lowered + note", "obstacle": "wheelchair=limited or no", "uneven": "smoothness=bad",
            "no_tactile": "tactile_paving=no", "stairs_only": "wheelchair=no", "lighting": "lit=no", "no_footpath": "sidewalk=no"}

def read_js(path):
    """Parse `window.X = <json>;` files: take from the first `=` to the last `;`."""
    t = open(os.path.join(ROOT, path), encoding="utf-8").read()
    body = t[t.index("= ", t.index("window.")) + 2:]
    return json.loads(body[:body.rindex(";")])

def main():
    os.makedirs(OUT, exist_ok=True)
    survey = read_js("data/survey.js"); props = read_js("data/ai_barriers.js")
    manifest = {m["id"]: m for m in json.load(open(MANIFEST))} if os.path.exists(MANIFEST) else {}
    gold = {}
    gp = os.path.join(ROOT, "labels", "gold.csv")
    if os.path.exists(gp): gold = {r["image_id"]: r for r in csv.DictReader(open(gp))}
    byid = {r[0]: r for r in props["rows"]}
    recs = []
    for s in survey:
        if not s.get("cat"): continue
        recs.append({"id": "survey_" + s["file"], "lat": s["lat"], "lng": s["lng"], "type": s["cat"], "severity": s.get("sev", ""), "source": "field survey",
                     "evidence": "photo by " + s.get("credit", ""), "confidence": "field photo", "street": s.get("street", ""), "area": s.get("area", ""),
                     "note": s.get("desc", ""), "photo": "https://omdorkar.github.io/vadodara-access-map/" + s["photo"], "captured": "", "osm_hint": OSM_HINT.get(s["cat"], ""), "license": "CC-BY-SA 4.0"})
    for img, g in gold.items():
        r = byid.get(img); m = manifest.get(img, {})
        if not r or g["label"] in ("ok_footpath", "open_road"): continue
        recs.append({"id": img, "lat": r[1], "lng": r[2], "type": g["label"], "severity": "", "source": r[4] + " photo, labelled by volunteers",
                     "evidence": f"{g['agree']} of {g['votes']} votes agree", "confidence": "confirmed by vote", "street": "", "area": "", "note": "",
                     "photo": r[5], "captured": __import__("datetime").datetime.utcfromtimestamp(r[3] / 1000).date().isoformat() if r[3] else "",
                     "osm_hint": OSM_HINT.get(g["label"], ""), "license": m.get("license", "CC-BY-SA 4.0")})
    cols = list(recs[0].keys()) if recs else []
    with open(os.path.join(OUT, "barriers.csv"), "w", newline="") as f:
        w = csv.DictWriter(f, cols); w.writeheader(); w.writerows(recs)
    feat = lambda r, extra={}: {"type": "Feature", "geometry": {"type": "Point", "coordinates": [r["lng"], r["lat"]]}, "properties": {**{k: v for k, v in r.items() if k not in ("lat", "lng")}, **extra}}
    json.dump({"type": "FeatureCollection", "license": "CC-BY-SA 4.0", "features": [feat(r) for r in recs]}, open(os.path.join(OUT, "barriers.geojson"), "w"))
    # MapRoulette: one task per confirmed barrier, with an instruction for the mapper.
    tasks = [feat(r, {"instruction": f"A {r['type'].replace('_', ' ')} was recorded here ({r['source']}; {r['evidence']}). Check the photo: {r['photo']} . "
                                        f"If it is still there, tag the kerb/footway/entrance in OSM, e.g. {r['osm_hint']}."}) for r in recs]
    json.dump({"type": "FeatureCollection", "features": tasks}, open(os.path.join(OUT, "maproulette.geojson"), "w"))
    votes = {}
    for r in gold.values(): votes[r["image_id"]] = r["votes"]
    with open(os.path.join(OUT, "proposals.csv"), "w", newline="") as f:
        w = csv.writer(f); w.writerow(["image_id", "lat", "lng", "captured_at", "source", "page", "ai_label", "ai_prob", "p_footpath", "nearest_seed", "seed_similarity", "seed_label", "sidewalk_share", "road_share", "rule_verdict", "model", "votes", "gold_label"])
        for r in props["rows"]: w.writerow(r[:16] + [votes.get(r[0], 0), gold.get(r[0], {}).get("label", "")])
    print(json.dumps({"barriers": len(recs), "proposals": len(props["rows"]), "maproulette_tasks": len(tasks), "out": OUT}))

if __name__ == "__main__":
    main()
