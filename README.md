# Vadodara Access Map

A free, open-source map of physical-mobility barriers (broken or missing ramps, blocked footpaths, missing kerb cuts, no tactile paving, steps with no alternative) in Vadodara and its outskirts, India. It is a **remote audit** (street-level photos and OpenStreetMap data) plus a small set of photos taken by Om Dorkar. It is not a full survey: see [docs/METHOD.md](docs/METHOD.md) for what was and was not done. It was inspired by the University of Alberta Mobility Mapping Project.

<!-- Screenshot: add docs/screenshot.png once the survey photos are on the map. -->

## Why Vadodara
Local news has reported for years that the city is hard to get around for people with disabilities:

- **"Vadodara's buildings are not disabled-friendly"**, *Times of India*, 24 July 2014. Replies to RTI requests showed that most buildings in the district lacked ramps, accessible lifts, parking, toilets and signage.
- **"City yet to adapt to needs of the disabled"**, *Times of India*, 4 July 2014. Apart from the collector's office, public buildings and places remained difficult to access, despite repeated petitions from NGOs and disability groups to the Vadodara Municipal Corporation.
- **[Motorised stair-climber wheelchairs launched at Vadodara railway station](https://deshgujarat.com/2022/11/03/motorised-stair-climber-wheelchair-facility-at-vadodara-station/)**, *DeshGujarat*, 3 November 2022 (also covered by the *Times of India*). This is a welcome step, but the report notes it was needed because lifts and escalators could not be provided on the other platforms.

Those reports are now years old. This project asks a simple question: **what is it like today, street by street?** It answers with photos and locations anyone can check.

The method is inspired by the University of Alberta's [Atlas / Click&Push](https://www.ualberta.ca/en/folio/2025/04/overcoming-obstacles.html) work. That team combines crowdsourced barrier reports with camera and GPS data, and is developing deep learning to detect barriers automatically. This project is a small, student-led version of the same idea, for one area of Vadodara.

**Live map: https://omdorkar.github.io/vadodara-access-map/** · Built by Om Dorkar · OpenStreetMap: [Om Dorkar](https://www.openstreetmap.org/user/Om%20Dorkar)

## How the AI works
Like the University of Alberta project, this map pairs people with machine vision, and the machine learns from the people. Full detail in [docs/LEARNING_LOOP.md](docs/LEARNING_LOOP.md).

1. **Photos, no camera needed.** Street-level photos from Mapillary, Panoramax and geotagged Wikimedia Commons photos (all openly licensed), plus Om's own photos. [tools/learn/fetch_images.py](tools/learn/fetch_images.py).
2. **Footpath rule.** Mapillary labels every photo (road, sidewalk, kerb, crossing...). [tools/scan_core.js](tools/scan_core.js) asks: is there a road, and is a footpath visible? Whole stretches of street are coloured green or red ([data/ai_streets.js](data/ai_streets.js)); a road with no photo stays uncoloured.
3. **Barrier detector.** Open models run locally: CLIP embeds each photo, SegFormer measures road and sidewalk pixels, and a small classifier trained on Om's labelled photos, confirmed votes and the footpath rule proposes *footpath present?* and *barrier type*. Every photo is also matched to the most similar confirmed barrier photo. [tools/learn/score_images.py](tools/learn/score_images.py) → [data/ai_barriers.js](data/ai_barriers.js).
4. **People check the AI.** [label.html](https://omdorkar.github.io/vadodara-access-map/label.html) shows one photo at a time with the AI's proposal and the look-alike confirmed photo. Y / N / can't tell. Two agreeing votes make a confirmed label.
5. **It learns and measures itself.** Every Monday ([.github/workflows/learn.yml](.github/workflows/learn.yml)) the detector refits on the confirmed labels, re-scores every photo, and rewrites [METRICS.md](METRICS.md) with cross-validated accuracy. The footpath scan ([ai-scan.yml](.github/workflows/ai-scan.yml)) runs the same morning.
6. **Open dataset.** [dataset/](dataset/) holds `barriers.csv` / `.geojson` (field survey + confirmed labels), `proposals.csv` (every AI call, for audit) and `maproulette.geojson` (a ready MapRoulette challenge so OpenStreetMap mappers add the tags).

Current state (see METRICS.md): 553 open photos scored; 0 confirmed votes yet; detector trained on 11 field photos + 331 weak footpath-rule labels; *footpath present?* at ~75% cross-validated agreement with the rule; barrier types not yet callable, so the map proposes look-alikes of Om's confirmed photos instead.

Footpath scan, first run (25 Oct 2026): 721 photos; 288 judged as built-up streets in daylight; a footpath was detected in 142 (49%) and not in 146. 13 zebra crossings were found. By area: Vadodara Bypass 32% (132 photos), Manjalpur 81% (90), Wadi 44% (32), Nava Bazaar 44% (27); other areas had too few photos. In a spot check of 12 "no footpath" dots, 8 clearly had none and 4 were unclear. The model almost never detects kerb ramps, so crossings are flagged to check, not counted as barriers. Coverage is mostly main roads photographed from vehicles.

## Use it for another city
Everything city-specific is in [data/city.js](data/city.js): the name, the box to scan, where the map opens and the time zone. Fork the repository, change that file, run the Action once (Actions tab, "AI street scan", Run workflow) and turn on GitHub Pages. The text on the page still mentions Vadodara in places and would need editing.

## What's on the map
- **AI street scan** (small dots, on by default): green = footpath seen, red = no footpath seen on a built-up street, grey = open road, purple ring = zebra crossing to check for a ramp.
- **Field survey pins** (square): Om's own photos, each credited. A few show the setting but not the barrier itself, and their notes say so. Tap one for the photo, severity, details and location.
- **Your reports** (ringed): reports a visitor makes, stored in their own browser for now (exportable as JSON).
- **Documentation only** (grey, dotted): photos that show no footpath barrier (Canal Road) or were taken far away (Pavagadh Hill). Not counted.
- **Sample data** (faded, dashed): 16 illustrative pins, clearly labelled. They are not findings, and they hide automatically once real survey data exists.
- **AI-suggested (unverified)** (purple diamonds, off by default): open street photos the detector proposes, or that look like one of Om's confirmed barrier photos. Nobody has checked them on the ground. They are not findings and are not counted. [Check them](https://omdorkar.github.io/vadodara-access-map/label.html) and the detector learns.
- **Mapillary photos** (green dots): real street-level imagery (CC-BY-SA). You can mark a barrier you see in a photo.
- **Already known in OSM** (green / orange / red dots): places and kerbs where OpenStreetMap mappers recorded wheelchair access, kerb height or tactile paving. These are other people's data, shown as context.
- **OSM possible gaps** (purple dashes): mapped footways and crossings missing `kerb` / `wheelchair` / `tactile_paving` tags. This shows missing data, not a confirmed barrier, with a link to answer it in MapComplete. Off by default; switch it on under Layers & filters.
- **Community reports** (double ring): visitor reports shared to the database and approved. Switched on once Supabase is set up (see [docs/SHARED_REPORTS.md](docs/SHARED_REPORTS.md)).
- **[Street report](https://omdorkar.github.io/vadodara-access-map/report.html)**: a printable, street-by-street list of the surveyed barriers with photos, locations and suggested fixes, for sending to the city.
- **Street / satellite** background (OSM and Esri World Imagery), plus filters by type and severity.

## How to report a barrier
1. Tap **Report a barrier** and pick the closest type (missing ramp, broken ramp, blocked footpath, damaged footpath, no tactile paving, steps only, poor lighting).
2. Move the map so the pin sits exactly on the barrier, or tap **Use my location**.
3. Answer the short questions: severity, one detail question, an optional note and photo.

Where OpenStreetMap has a standard tag, the answer is stored as that tag (`kerb=raised|lowered|flush`, `tactile_paving=no|incorrect`, `wheelchair=no|limited`, `lit=no`). Verified points can then be added to OpenStreetMap, for example with [MapComplete OnWheels](https://mapcomplete.org/onwheels), whose question design inspired this flow.

## Run it
Open `index.html` in a browser. There's no build step and nothing to install.
If the street map tiles show "access blocked" when opened as a file, serve the folder instead, e.g. `python3 -m http.server` and visit http://localhost:8000. (OSM tile servers want a referring website.)

For the Mapillary layer, paste a free client token from https://www.mapillary.com/dashboard/developers into `MAPILLARY_TOKEN` in `index.html`, or into the box under **Layers & filters**.

## Add survey photos
See [PHOTO_GUIDE.md](PHOTO_GUIDE.md). In short: put photos in `photos/originals/`, notes in `photos/notes.csv`, then run
```
osascript -l JavaScript tools/process_photos.js "$PWD"
```
(The photo credit defaults to Om Dorkar; pass a different name as a second argument if someone else took the photos.)
(macOS only; uses built-in ImageIO, no installs). Originals are git-ignored. Only metadata-stripped web copies are published.

## Files
| Path | Purpose |
|---|---|
| `index.html` | The map (Leaflet 1.9.4 from cdnjs). Settings for Mapillary, OSM username and Supabase are at the top of its script |
| `report.html` | Printable street report, generated from the survey data |
| `data/survey.js` | Field survey records (generated, hand-editable: type, severity, note, `tags`, street) |
| `data/vocab.js` | Barrier types, severity levels, questions and suggested fixes, shared by both pages |
| `photos/web/` | Published survey photos and thumbnails |
| `tools/process_photos.js` | Reads photo GPS, makes web copies, looks up street names, writes `data/survey.js` |
| `label.html` | Check-the-AI page: one photo, the AI's proposal, Y/N votes that become training labels |
| `tools/learn/` | Learning loop: fetch open photos, score, learn from votes, export dataset (`docs/LEARNING_LOOP.md`) |
| `data/ai_barriers.js` | Detector proposals, one row per photo (generated) |
| `labels/gold.csv` | Confirmed labels from votes (generated); `labels/checks_export/` for exported vote files |
| `dataset/` | Open dataset: barriers CSV/GeoJSON, AI proposals, MapRoulette challenge (generated) |
| `METRICS.md` | Detector accuracy, rewritten every run |
| `supabase/schema.sql` | Database tables and access rules for shared reports and AI checks |
| `docs/SHARED_REPORTS.md` | Setting up and reviewing shared reports |
| `docs/OUTREACH.md` | Consent note, interview questions, letters to a disability organisation and the VMC |
| `DATA_SOURCES.md` | Every data source and its licence |

## Limitations
Sample pins are invented (and hide once survey data exists). Visitor reports stay in their own browser until shared storage is switched on, and shared ones are reviewed for plausibility, not verified on the ground. OSM coverage of footways here is thin. Satellite imagery can't show ramp condition. Phone GPS is accurate to about 5–15 m.

## Roadmap
1. Field survey: 10–15 barriers with geotagged photos, plus a Mapillary street-level sequence of the route (in progress).
2. Contribute verified kerb, tactile-paving and entrance data to OpenStreetMap, from the ground survey only.
3. Shared, moderated storage for condition problems OSM doesn't map (broken ramps, blocked footpaths), so everyone sees each other's reports.
4. Talk to wheelchair users and a local disability organisation; send a street-by-street report to the Vadodara Municipal Corporation.
5. ~~A small ramp/obstacle detector trained only on suitably licensed photos.~~ Built as a learning loop (docs/LEARNING_LOOP.md): it proposes, people confirm, it refits weekly. Fine-tune a segmentation model once confirmed labels pass ~500.

## Licence
Code: MIT ([LICENSE](LICENSE)). Survey data and photos: CC-BY-SA 4.0 ([LICENSE-DATA.md](LICENSE-DATA.md)). Third-party data keeps its own licence ([DATA_SOURCES.md](DATA_SOURCES.md)).
