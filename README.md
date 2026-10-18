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

## What's on the map
- **Field survey pins** (square): geotagged photos taken on foot in the study area, each credited.
- **Added by you**: reports visitors make in their own browser (exportable as JSON).
- **Sample data**: 16 illustrative pins, clearly labelled. These are not findings.
- **Mapillary photos**: real street-level imagery (CC-BY-SA). Visitors can mark barriers they see in a photo.
- **OSM possible gaps**: mapped footways and crossings missing `kerb` / `wheelchair` / `tactile_paving` tags. This shows missing data, not a confirmed barrier.
- **Street / satellite** toggle (OSM and Esri World Imagery).

## Run it
Open `index.html` in a browser. There's no build step and nothing to install.
If the street map tiles show "access blocked" when opened as a file, serve the folder instead, e.g. `python3 -m http.server` and visit http://localhost:8000. (OSM tile servers want a referring website.)

For the Mapillary layer, paste a free client token from https://www.mapillary.com/dashboard/developers into `MAPILLARY_TOKEN` in `index.html`, or into the sidebar box.

## Add survey photos
See [PHOTO_GUIDE.md](PHOTO_GUIDE.md). In short: put photos in `photos/originals/`, notes in `photos/notes.csv`, then run
```
osascript -l JavaScript tools/process_photos.js "$PWD" "Photographer name"
```
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
1. Field survey: 20–30 geotagged photos (in progress).
2. Shared storage so everyone sees each other's reports.
3. Contribute verified kerb / tactile-paving tags back to OpenStreetMap.
4. A small ramp/obstacle detector trained only on suitably licensed photos.

## Licence
Code: MIT ([LICENSE](LICENSE)). Survey data and photos: CC-BY-SA 4.0 ([LICENSE-DATA.md](LICENSE-DATA.md)). Third-party data keeps its own licence ([DATA_SOURCES.md](DATA_SOURCES.md)).
