#!/usr/bin/env python3
"""Step 3 of the learning loop: turn human votes into gold labels and fit the detector head.

  pull_checks()  -> reads votes from Supabase (table `checks`, see supabase/schema.sql) if SUPABASE_URL and
                    SUPABASE_KEY are set, else from labels/checks_export/*.json (files people exported from label.html).
  make_gold()    -> majority vote per photo (needs >= MIN_VOTES votes, >= 2/3 agreement) -> labels/gold.csv
  fit_head()     -> logistic regression on CLIP embeddings. Training labels: gold (weight 3) + the footpath rule's
                    weak F/N verdicts (weight 1). Two tasks: footpath present? and barrier type. Cross-validated.
  write_metrics()-> METRICS.md: how good the detector is right now, per model version, so the repo measures itself.

Run alone: python3 tools/learn/learn.py   (score_images.py imports fit_head and calls it too)
"""
import csv, glob, json, os, sys
from collections import Counter, defaultdict
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import ROOT, MANIFEST, EMB, GOLD, MODEL_VERSION

MIN_VOTES = 2
CHECKS_DIR = os.path.join(ROOT, "labels", "checks_export")
WEAK = {"F": "ok_footpath", "N": "no_footpath", "O": "open_road"}

def pull_checks():
    url, key = (os.environ.get("SUPABASE_URL") or "").strip(), (os.environ.get("SUPABASE_KEY") or "").strip()
    rows = []
    if url and key:
        import requests
        if "://" not in url: url = "https://" + url   # tolerate a secret saved without the scheme
        url = url.rstrip("/").removesuffix("/rest/v1")
        try:
            while True:   # Supabase returns at most 1000 rows per request, so page through
                r = requests.get(f"{url}/rest/v1/checks?select=image_id,label,voter&order=id&limit=1000&offset={len(rows)}",
                                 headers={"apikey": key, "Authorization": f"Bearer {key}"}, timeout=60)
                r.raise_for_status(); page = r.json(); rows += page
                if len(page) < 1000: break
        except Exception as e:   # e.g. a paused free project: carry on with exported votes rather than fail the run
            print(f"::warning::Could not read votes from Supabase ({e}); using labels/checks_export only.")
            rows = []
    for f in glob.glob(os.path.join(CHECKS_DIR, "*.json")):
        rows += [c for c in json.load(open(f)).get("checks", []) if c.get("image_id") and c.get("label")]
    return rows

def make_gold(checks):
    votes = defaultdict(dict)
    for c in checks: votes[c["image_id"]][c.get("voter") or "anon"] = c["label"]   # one vote per voter per photo
    gold = {}
    for img, vv in votes.items():
        if len(vv) < MIN_VOTES: continue
        lab, n = Counter(vv.values()).most_common(1)[0]
        if n / len(vv) >= 2 / 3 and lab not in ("unsure", "not_street"): gold[img] = (lab, n, len(vv))
    os.makedirs(os.path.dirname(GOLD), exist_ok=True)
    with open(GOLD, "w", newline="") as f:
        w = csv.writer(f); w.writerow(["image_id", "label", "agree", "votes"])
        for img in sorted(gold): w.writerow([img, *gold[img]])
    return {k: v[0] for k, v in gold.items()}, len(votes)

def _training_set(emb, manifest, gold, path_of, seeds):
    X, y_fp, y_type, w = [], [], [], []
    for path, lab, _ in seeds:                          # Om's labelled field photos count like gold
        if path in emb and lab != "no_barrier": X.append(emb[path]); w.append(3.0); y_type.append(lab); y_fp.append(-1)
    for m in manifest:
        p = path_of(m)
        if p not in emb: continue
        g = gold.get(m["id"]); weak = WEAK.get(m.get("rule_verdict", ""))
        lab = g or weak
        if not lab: continue
        X.append(emb[p]); w.append(3.0 if g else 1.0); y_type.append(lab)
        y_fp.append(1 if lab == "ok_footpath" else 0 if lab in ("no_footpath", "obstacle", "uneven", "missing_ramp", "broken_ramp", "stairs_only") else -1)
    return np.array(X), np.array(y_fp), np.array(y_type), np.array(w)

def fit_head(emb, manifest, gold, seeds=()):
    """Returns (predict(vec) -> (type label, prob), metrics dict). Footpath task uses only rows with a 0/1 answer."""
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import cross_val_predict, StratifiedKFold
    path_of = lambda m: os.path.join(ROOT, "ai_cache", "img", m["id"] + ".jpg")
    X, yfp, ytype, w = _training_set(emb, manifest, gold, path_of, seeds)
    metrics = {"model": MODEL_VERSION, "train_rows": int(len(X)), "gold_rows": int(len(gold)), "seed_rows": int(sum(1 for _, l, _ in seeds if l != "no_barrier")), "weak_rows": int((w == 1).sum())}
    keep = yfp >= 0
    fp = LogisticRegression(C=0.5, max_iter=2000, class_weight="balanced")
    if keep.sum() >= 20 and len(set(yfp[keep])) == 2:
        cv = StratifiedKFold(5, shuffle=True, random_state=0)
        pred = cross_val_predict(fp, X[keep], yfp[keep], cv=cv, params={"sample_weight": w[keep]})
        tp = int(((pred == 1) & (yfp[keep] == 1)).sum()); fpos = int(((pred == 1) & (yfp[keep] == 0)).sum()); fn = int(((pred == 0) & (yfp[keep] == 1)).sum())
        metrics["footpath"] = {"rows": int(keep.sum()), "cv_accuracy": round(float((pred == yfp[keep]).mean()), 3),
                               "precision": round(tp / max(tp + fpos, 1), 3), "recall": round(tp / max(tp + fn, 1), 3)}
        fp.fit(X[keep], yfp[keep], sample_weight=w[keep])
    else: fp = None
    types = Counter(ytype); ok = [t for t, n in types.items() if n >= 2]
    tk = np.isin(ytype, ok)
    tm = LogisticRegression(C=0.5, max_iter=2000)   # no class re-weighting: 3 seed photos must not out-vote 300 weak rows
    if len(ok) >= 2 and tk.sum() >= 20:
        pred = cross_val_predict(tm, X[tk], ytype[tk], cv=StratifiedKFold(3, shuffle=True, random_state=0), params={"sample_weight": w[tk]})
        metrics["type"] = {"rows": int(tk.sum()), "classes": dict(sorted(types.items())), "cv_accuracy": round(float((pred == ytype[tk]).mean()), 3)}
        tm.fit(X[tk], ytype[tk], sample_weight=w[tk])
    else: tm = None
    def predict(v):
        v = v[None, :]
        p_fp = float(fp.predict_proba(v)[0, 1]) if fp is not None else None
        if tm is not None:
            pr = tm.predict_proba(v)[0]; k = int(pr.argmax()); return tm.classes_[k], float(pr[k]), p_fp
        return None, None, p_fp
    return predict, metrics

def write_metrics(metrics, tally, n_photos, n_voted):
    lines = [f"# Detector metrics ({metrics['model']})", "",
             "Written by tools/learn/learn.py on every run. Cross-validated on the training rows, so these are honest",
             "estimates for photos like the ones already seen, not a guarantee for new streets.", "",
             f"- Photos scored: {n_photos}", f"- Training rows: {metrics['train_rows']} ({metrics['gold_rows']} gold from human votes, {metrics.get('seed_rows', 0)} from the field survey, {metrics['weak_rows']} weak from the footpath rule)",
             f"- Photos with any vote: {n_voted}", ""]
    if "footpath" in metrics:
        m = metrics["footpath"]; lines += ["## Footpath present?", f"- rows {m['rows']}, cross-validated accuracy {m['cv_accuracy']}, precision {m['precision']}, recall {m['recall']}", ""]
    if "type" in metrics:
        m = metrics["type"]; lines += ["## Barrier type", f"- rows {m['rows']}, {len(m['classes'])} classes, cross-validated accuracy {m['cv_accuracy']}",
                                        "- class counts: " + ", ".join(f"{k} {v}" for k, v in m["classes"].items()), ""]
    else: lines += ["## Barrier type", "- not enough labelled rows yet (need 2+ photos in each of 2+ classes). Label photos in label.html.", ""]
    lines += ["## Current proposals", "- " + ", ".join(f"{k} {v}" for k, v in sorted(tally.items())), "",
              "Weak labels come from tools/scan_core.js (Mapillary detections). Gold labels come from people's votes in label.html,",
              "majority of >= 2 voters. Gold outweighs weak 3:1. See docs/LEARNING_LOOP.md."]
    open(os.path.join(ROOT, "METRICS.md"), "w").write("\n".join(lines) + "\n")

if __name__ == "__main__":
    checks = pull_checks(); gold, n_voted = make_gold(checks)
    print(json.dumps({"checks": len(checks), "photos_voted": n_voted, "gold": len(gold)}))
