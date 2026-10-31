# Method and limits

A one-page, honest description of how this map was made and what it can and cannot tell you.

## What the map is
A remote accessibility audit of Vadodara and its outskirts, with a small number of photographs taken by Om Dorkar. It is not a full survey of the city.

## Where the data comes from
| Layer on the map | Source | How much to trust it |
|---|---|---|
| **Field survey** (square pins) | Om's own photos, each credited | Eleven records. Type and severity are Om's judgement. In four of them the photo shows the setting but not the barrier itself, and the note says so. Kerb heights were not measured. |
| **Documentation only** (grey, dotted) | Photos that do not show a footpath barrier (Canal Road) or were taken far from the city (Pavagadh Hill). | Context only. Not counted. |
| **AI street scan** (small dots) | Mapillary's own computer vision on 721 street photos, plus a simple rule (tools/ai_scan.js) | Machine guesses. In a spot check of 12 "no footpath" dots, 8 were clearly right and 4 unclear. A footpath hidden behind parked cars is missed. Kerb ramps are almost never detected. |
| **AI-suggested (unverified)** (purple, off by default) | Open street photos (Mapillary, Panoramax, Wikimedia Commons) that the detector in tools/learn/ proposes, or that look like one of Om's confirmed barrier photos | Low. Nobody has checked these on the ground. Accuracy so far is in METRICS.md; people's votes in label.html retrain it weekly (docs/LEARNING_LOOP.md). |
| **Mapillary photos** (green dots) | 721 street-level images across the city, mostly highways | Real imagery, CC-BY-SA, but mostly not footpaths. |
| **Already known in OSM / possible gaps** | OpenStreetMap tags | Other people's data. A "gap" means a missing tag, not a confirmed barrier. |

## What was not done
- No systematic walk. Om could not survey on foot, so there is no count of how many kerbs or crossings were checked, and no percentage.
- No measurements (kerb height, slope, width).
- No review by anyone who uses a wheelchair, pram or stick.
- Google Maps and Street View imagery was not used (its terms forbid copying it or analysing it).

## How the AI suggestions are made
Open models run on every openly licensed street photo in the box (553 at the first run): CLIP embeddings, a SegFormer road/sidewalk pixel share, and a small classifier trained on Om's 11 labelled photos, confirmed votes, and the footpath rule's verdicts. Its cross-validated accuracy is written to METRICS.md on every run. With no votes yet it cannot call barrier types, so it proposes photos that closely resemble a confirmed barrier photo. Proposals are shown to be checked in label.html, not trusted; confirmed labels retrain it every Monday. See docs/LEARNING_LOOP.md.

## How the AI street scan works
For every Mapillary photo in the city box, the tool downloads Mapillary's detection labels. A photo taken in daylight that contains a road is judged: if a sidewalk or pedestrian area is labelled, it is green. If not, and there are at least three buildings and no flyover or guard rail (a sign of a highway), it is red. Other roads are grey. Night photos are skipped. The rule is in tools/ai_scan.js so anyone can read and change it.

## Streets
Each judged photo is snapped to the nearest OpenStreetMap road within 25 m. Roads are cut into pieces of up to 50 m, and a piece takes the majority verdict of its photos. Neighbouring pieces with the same verdict are joined. Only pieces with a photo are coloured. Nothing is inferred for roads without photos: in OpenStreetMap, Vadodara has about 26,700 road segments and only 8 say whether there is a footpath, so there is no honest basis for guessing.

## Updates
The scan re-runs every Monday on GitHub (.github/workflows/ai-scan.yml) and publishes only if the results changed. New Mapillary photos therefore appear without anyone running anything.

## How to improve it
1. People who live nearby confirm or reject each AI suggestion.
2. Volunteers send photos from their own streets (see PHOTO_GUIDE.md) and the survey grows from real photos.
3. Confirmed kerbs and entrances are added to OpenStreetMap so others can use them.
4. The street report goes to the city and to disability groups, and any reply is logged.
