#!/usr/bin/env python3
"""Step 2 of the learning loop: score every collected photo for footpath barriers.

All models are open and run locally on CPU (a few minutes for ~500 photos):
  1. CLIP (open_clip ViT-B-32) embeds every photo once -> ai_cache/emb.npz (cached).
  2. SegFormer-B0 (Cityscapes) gives the share of pixels that are road and sidewalk. A photo with almost no
     road is "not a street view" (temples, portraits...) and is not scored further. --no-seg skips this step.
  3. A logistic head on the embeddings (tools/learn/learn.py) predicts (a) footpath present? and (b) barrier
     type. It trains on gold labels from people's votes (labels/gold.csv) plus the footpath rule's weak F/N
     verdicts from data/ai_scan.js, so it works from day one and sharpens as votes arrive. Cross-validated
     numbers go to METRICS.md.
  4. Nearest seed: each photo is compared with Om's labelled field photos (photos/web, categories from
     data/survey.js), his documentation-only photos (no barrier) and every gold-labelled photo. The map shows
     "looks like <this confirmed photo>" so a reviewer can judge by analogy.

Writes data/ai_barriers.js. Row: [image id, lat, lng, captured_at ms, source, page url, type label, type prob,
P(footpath present), nearest seed file, seed similarity, seed label, sidewalk share, road share, rule verdict, model, stable image url (Mapillary urls expire, so null there)]
"""
import json, os, sys, datetime
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import ROOT, MANIFEST, EMB, read_survey, load_gold, MODEL_VERSION
from learn import pull_checks, make_gold, fit_head, write_metrics

MIN_ROAD = 0.03          # below this road share the photo is not treated as a street view
SEG_CACHE = os.path.join(ROOT, "ai_cache", "seg.json")

def embed_all(paths):
    import torch, open_clip
    done = {}
    if os.path.exists(EMB):
        z = np.load(EMB, allow_pickle=True); done = dict(zip(z["ids"].tolist(), z["emb"]))
    todo = [p for p in paths if p not in done]
    if todo:
        model, _, pre = open_clip.create_model_and_transforms("ViT-B-32", pretrained="laion2b_s34b_b79k"); model.eval()
        with torch.no_grad():
            for i in range(0, len(todo), 16):
                batch = todo[i:i + 16]
                e = model.encode_image(torch.stack([pre(Image.open(p).convert("RGB")) for p in batch]))
                e = e / e.norm(dim=-1, keepdim=True)
                for p, v in zip(batch, e.numpy()): done[p] = v
                print(f"embedded {min(i + 16, len(todo))}/{len(todo)}", file=sys.stderr)
        np.savez(EMB, ids=np.array(list(done.keys())), emb=np.stack(list(done.values())))
    return done

def segment(paths):
    cache = json.load(open(SEG_CACHE)) if os.path.exists(SEG_CACHE) else {}
    todo = [p for p in paths if os.path.basename(p) not in cache]
    if todo:
        import torch
        from transformers import SegformerImageProcessor, SegformerForSemanticSegmentation
        name = "nvidia/segformer-b0-finetuned-cityscapes-1024-1024"
        proc, model = SegformerImageProcessor.from_pretrained(name), SegformerForSemanticSegmentation.from_pretrained(name).eval()
        with torch.no_grad():
            for n, p in enumerate(todo):
                pred = model(**proc(images=Image.open(p).convert("RGB"), return_tensors="pt")).logits.argmax(1)[0].numpy()
                cache[os.path.basename(p)] = [round(float((pred == 1).mean()), 4), round(float((pred == 0).mean()), 4)]  # sidewalk, road
                if n % 25 == 0: print(f"segmented {n}/{len(todo)}", file=sys.stderr); json.dump(cache, open(SEG_CACHE, "w"))
        json.dump(cache, open(SEG_CACHE, "w"))
    return {p: cache.get(os.path.basename(p), [None, None]) for p in paths}

def main():
    manifest = json.load(open(MANIFEST))
    path_of = lambda m: os.path.join(ROOT, "ai_cache", "img", m["id"] + ".jpg")
    paths = [path_of(m) for m in manifest]
    seeds = [(os.path.join(ROOT, "photos", "web", f), lab, f) for f, lab, _ in read_survey()]
    seeds += [(os.path.join(ROOT, "photos", "context", f), "no_barrier", f) for f in sorted(os.listdir(os.path.join(ROOT, "photos", "context"))) if f.endswith(".jpg") and "thumb" not in f]
    emb = embed_all(paths + [s[0] for s in seeds])
    seg = segment(paths) if "--no-seg" not in sys.argv else {p: [None, None] for p in paths}
    gold, n_voted = make_gold(pull_checks())
    predict, metrics = fit_head(emb, manifest, gold, seeds)

    bank = [(emb[p], lab, name) for p, lab, name in seeds] + [(emb[path_of(m)], gold[m["id"]], m["id"]) for m in manifest if m["id"] in gold]
    B = np.stack([b[0] for b in bank])
    rows, tally = [], {}
    for m, p in zip(manifest, paths):
        v = emb[p]; sw, rd = seg[p]
        if rd is not None and rd < MIN_ROAD: label, prob, pfp = "not_street", None, None
        else: label, prob, pfp = predict(v)
        sims = B @ v; j = int(sims.argmax())
        rows.append([m["id"], m["lat"], m["lng"], m["ts"], m["source"], m.get("page", ""), label, None if prob is None else round(prob, 3),
                     None if pfp is None else round(pfp, 3), bank[j][2], round(float(sims[j]), 3), bank[j][1], sw, rd, m.get("rule_verdict", ""), MODEL_VERSION, m.get("img_url")])
        tally[label or "unscored"] = tally.get(label or "unscored", 0) + 1
    gen = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    with open(os.path.join(ROOT, "data", "ai_barriers.js"), "w") as f:
        f.write("// AI barrier proposals. Generated by tools/learn/score_images.py. Do not edit by hand. PROPOSALS to check, not findings.\n")
        f.write("// Row: [image id, lat, lng, captured_at ms, source, page url, type label, type prob, P(footpath present), nearest seed photo, seed similarity, seed label, sidewalk share, road share, footpath-rule verdict, model, stable image url or null]\n")
        f.write("window.AI_BARRIERS = " + json.dumps({"generated": gen, "model": MODEL_VERSION, "metrics": metrics, "gold": len(gold), "seeds": len(bank), "tally": tally, "rows": rows}) + ";\n")
    write_metrics(metrics, tally, len(rows), n_voted)
    print(json.dumps({"photos": len(rows), "seeds": len(bank), "gold": len(gold), "metrics": metrics, "tally": tally}, indent=1))

if __name__ == "__main__":
    main()
