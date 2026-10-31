# The learning loop

How the map learns to find barriers from photos nobody had to go out and take. Modelled on the University of
Alberta Mobility Mapping / Click&Push approach: crowd reports + camera imagery + a detector that improves from
confirmed labels. Everything runs on free services and open models; no field work is needed to keep it going.

```
open street photos ──> detector proposes ──> people check (label.html) ──> gold labels ──> detector refits
 Mapillary, Panoramax,    CLIP embeddings +      Y / N / can't tell /         labels/gold.csv     every Monday
 Wikimedia Commons        logistic head           not a street                                    (learn.yml)
                                │                                                 │
                                └──> map layer "AI-suggested" + METRICS.md <──────┘
                                └──> dataset/ (CSV, GeoJSON, MapRoulette) for the city, NGOs and OSM mappers
```

## Steps and files

| Step | File | What it does |
|---|---|---|
| 1 Collect | `tools/learn/fetch_images.py` | Downloads openly licensed street photos in the city box: the Mapillary photos already judged by the footpath scan, Panoramax, and geotagged Wikimedia Commons photos (CC only). Caches to `ai_cache/` (not committed). |
| 2 Score | `tools/learn/score_images.py` | Embeds every photo with CLIP ViT-B/32. SegFormer-B0 (Cityscapes) measures road and sidewalk pixel share; photos with almost no road are "not a street view". A logistic head predicts *footpath present?* and *barrier type*. Each photo is also matched to its most similar confirmed photo (Om's field survey, or a gold-labelled photo). Writes `data/ai_barriers.js` and `METRICS.md`. |
| 3 Learn | `tools/learn/learn.py` | Pulls votes (Supabase `checks` table, or JSON files in `labels/checks_export/`), makes `labels/gold.csv` (majority of 2+ voters, 2/3 agreement), fits the head on gold (weight 3) + Om's field photos (weight 3) + the footpath rule's weak F/N verdicts (weight 1). Cross-validated metrics. |
| 4 Share | `tools/learn/export_dataset.py` | `dataset/barriers.csv` + `.geojson` (field survey + confirmed labels), `dataset/proposals.csv` (every AI proposal with scores and votes, for audit), `dataset/maproulette.geojson` (a MapRoulette challenge so OSM mappers add the tags). |
| Check | `label.html` | The labelling page. Shows one photo, what the AI proposed, and the most similar confirmed photo. Keys Y/N/U/S. Votes go to Supabase when configured, else stay in the browser and can be exported. Photos that look like a confirmed barrier photo come first. |
| Weekly | `.github/workflows/learn.yml` | Runs 1-4 every Monday after the footpath scan and commits what changed. |

## What "learning" means here, honestly

- **Day one (now):** there are 0 gold labels. The detector is trained on 11 field-survey photos and 331 weak labels
  from the footpath rule. It can tell *footpath present vs absent* at about 75% cross-validated accuracy and cannot
  yet propose barrier *types* with any confidence (too few examples). The map's "AI-suggested" layer therefore shows
  photos that *look like* one of Om's confirmed barrier photos (similarity >= 0.75), not detector type calls.
- **After ~50 gold labels per type:** the type head starts to make calls; `METRICS.md` will show per-class accuracy.
- **After ~500 gold labels:** worth fine-tuning a segmentation model (start from Mapillary Vistas or Project
  Sidewalk weights, add Indian Driving Dataset) instead of the frozen-CLIP head. Not before.
- The weak labels are themselves machine guesses (Mapillary's detections), so "75%" means "agrees with Mapillary's
  model 75% of the time", not "75% right". Gold labels fix that as they arrive and are weighted 3:1.
- Nothing here is a finding. Proposals are shown to be checked. Only field-survey records and vote-confirmed labels
  go into `dataset/barriers.*`.

## Set-up (one-off, 15 minutes)

1. **Supabase:** run `supabase/schema.sql` (it now creates `checks` too). Paste the project URL and anon key into
   `label.html` and `index.html`. Add them as repository secrets `SUPABASE_URL`, `SUPABASE_KEY` so the Action can read votes.
2. **Action:** Actions tab -> "AI learning loop" -> Run workflow. The first run downloads ~550 photos and two
   small models (~400 MB, cached between runs) and takes about 15 minutes.
3. **Local run:** `python3 -m venv .venv && .venv/bin/pip install -r tools/learn/requirements.txt`, then
   `.venv/bin/python -I tools/learn/fetch_images.py && .venv/bin/python -I tools/learn/score_images.py && .venv/bin/python -I tools/learn/export_dataset.py`.
4. **Share:** send `dataset/barriers.csv` to the municipal corporation and disability groups (`docs/OUTREACH.md`),
   upload `dataset/maproulette.geojson` at maproulette.org as a challenge.

## Getting more photos without a camera

- Widen the box in `data/city.js` or add neighbouring towns; Mapillary has millions of Indian frames.
- Ask anyone who walks to record with the free Mapillary or Panoramax app. Their frames enter the loop next Monday.
- KartaView was tried and its API refuses anonymous requests. Google Street View is excluded by its terms.
