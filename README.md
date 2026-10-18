# Vadodara Access Map

A free, open-source map of physical-mobility barriers (broken or missing ramps, blocked footpaths, missing kerb cuts, no tactile paving, steps with no alternative) in one small area of Vadodara, India: **Alkapuri, Sayaji Baug and the railway station**. It was inspired by the University of Alberta Mobility Mapping Project.

<!-- Screenshot: add docs/screenshot.png once the survey photos are on the map. -->

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
