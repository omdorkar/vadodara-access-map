# Vadodara Access Map

A free, open-source map of physical-mobility barriers (broken or missing ramps, blocked footpaths, missing kerb cuts, no tactile paving, steps with no alternative) in one small area of Vadodara, India: **Alkapuri, Sayaji Baug and the railway station**. It was inspired by the University of Alberta Mobility Mapping Project.

<!-- Screenshot: add docs/screenshot.png once the survey photos are on the map. -->

## Why Vadodara
Local news has reported for years that the city is hard to get around for people with disabilities:

- **"Vadodara's buildings are not disabled-friendly"**, *Times of India*, 24 July 2014. Replies to RTI requests showed that most buildings in the district lacked ramps, accessible lifts, parking, toilets and signage.
- **"City yet to adapt to needs of the disabled"**, *Times of India*, 4 July 2014. Apart from the collector's office, public buildings and places remained difficult to access, despite repeated petitions from NGOs and disability groups to the Vadodara Municipal Corporation.
- **[Motorised stair-climber wheelchairs launched at Vadodara railway station](https://deshgujarat.com/2022/11/03/motorised-stair-climber-wheelchair-facility-at-vadodara-station/)**, *DeshGujarat*, 3 November 2022 (also covered by the *Times of India*). This is a welcome step, but the report notes it was needed because lifts and escalators could not be provided on the other platforms.

Those reports are now years old. This project asks a simple question: **what is it like today, street by street?** It answers with photos and locations anyone can check.

The method is inspired by the University of Alberta's [Atlas / Click&Push](https://www.ualberta.ca/en/folio/2025/04/overcoming-obstacles.html) work. That team combines crowdsourced barrier reports with camera and GPS data, and is developing deep learning to detect barriers automatically. This project is a small, student-led version of the same idea, for one area of Vadodara.

**Live map: https://omdorkar.github.io/vadodara-access-map/** · Built by Om Dorkar

## What's on the map
- **Field survey pins** (square): geotagged photos taken on foot in the study area, each credited. Tap one for the photo, severity, details and location.
- **Your reports** (ringed): reports a visitor makes, stored in their own browser for now (exportable as JSON).
- **Sample data** (faded, dashed): 16 illustrative pins, clearly labelled. They are not findings, and they hide automatically once real survey data exists.
- **Mapillary photos** (green dots): real street-level imagery (CC-BY-SA). You can mark a barrier you see in a photo.
- **OSM possible gaps** (purple dashes): mapped footways and crossings missing `kerb` / `wheelchair` / `tactile_paving` tags. This shows missing data, not a confirmed barrier, with a link to answer it in MapComplete.
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
| `index.html` | The whole site (Leaflet 1.9.4 from cdnjs) |
| `data/survey.js` | Field survey records (generated, hand-editable) |
| `photos/web/` | Published survey photos and thumbnails |
| `tools/process_photos.js` | Reads photo GPS, makes web copies, writes `data/survey.js` |
| `DATA_SOURCES.md` | Every data source and its licence |

## Limitations
Sample pins are invented. Visitor reports aren't shared between browsers yet. OSM coverage of footways here is thin. Satellite imagery can't show ramp condition. Phone GPS is accurate to about 5–15 m.

## Roadmap
1. Field survey: 10–15 barriers with geotagged photos, plus a Mapillary street-level sequence of the route (in progress).
2. Contribute verified kerb, tactile-paving and entrance data to OpenStreetMap, from the ground survey only.
3. Shared, moderated storage for condition problems OSM doesn't map (broken ramps, blocked footpaths), so everyone sees each other's reports.
4. Talk to wheelchair users and a local disability organisation; send a street-by-street report to the Vadodara Municipal Corporation.
5. A small ramp/obstacle detector trained only on suitably licensed photos.

## Licence
Code: MIT ([LICENSE](LICENSE)). Survey data and photos: CC-BY-SA 4.0 ([LICENSE-DATA.md](LICENSE-DATA.md)). Third-party data keeps its own licence ([DATA_SOURCES.md](DATA_SOURCES.md)).
