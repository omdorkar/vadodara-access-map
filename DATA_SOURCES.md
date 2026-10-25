# Data sources

Every source used on the site, with its licence and how it is used. Anything not from the field survey is labelled on the map.

| Source | What we use | Licence | How it's used / attribution |
|---|---|---|---|
| Field survey (this project) | Om's photos and notes, each showing the barrier it is labelled with. Not a systematic walk. | CC-BY-SA 4.0, credited to the surveyor on each pin | Shown as "Field survey" pins. Web copies have all metadata removed. Originals are not published. |
| [OpenStreetMap](https://www.openstreetmap.org/copyright) | Street map tiles; footway/crossing geometry and tags via the [Overpass API](https://overpass-api.de/) | ODbL 1.0 (data), tiles under the [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/) | Base map, the "already known in OSM" layer, and the "possible gap (unverified)" layer. Derived gap data stays ODbL, not CC-BY-SA. Credit: "© OpenStreetMap contributors". |
| [Esri World Imagery](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9) | Satellite tiles | Esri terms of use; display only, no download or tracing for redistribution | Satellite toggle. Credit: "Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community". |
| [Nominatim](https://nominatim.org/) (OpenStreetMap) | Street and area name for each survey photo, looked up once when photos are processed | ODbL 1.0 (OSM data); used within the [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/) (1 request/s, identified) | Shown as the street heading in the report. Can be corrected by hand. |
| [OpenStreetMap API](https://wiki.openstreetmap.org/wiki/API_v0.6) | Public edit count for the project's OSM account | ODbL 1.0 | "N edits to OpenStreetMap" line in About. |
| [Mapillary](https://www.mapillary.com/) | Street-level photos fetched live via the Graph API | CC-BY-SA 4.0 | Shown live with author name and link back. Images are not copied into this repo. |
| AI-suggested (this project) | Mapillary photos that a model (Claude) flagged as possible barriers | Photos CC-BY-SA 4.0 via Mapillary; suggestions are this project's | Layer "AI-suggested (unverified)", off by default. Not checked on the ground, not counted as findings. Photos are fetched live, not copied. |
| Sample data (this project) | 16 invented example reports at approximate locations | CC-BY-SA 4.0 | Labelled "Sample data" everywhere. Not findings. Hidden automatically once survey data exists. |

## Not used
- **Google Maps / Google Earth / Street View imagery or screenshots.** Google's terms forbid copying and redistributing it.
- **Data from other cities** (e.g. Project Sidewalk, RDD2022, Roboflow or Kaggle sets). These are only considered for later model training, would be listed here with their exact licence, and would never be shown as Vadodara findings.

## Checked facts (18 Oct 2026)
- Study-area bounding box: 22.298–22.322 N, 73.160–73.200 E.
- OSM had 26 footway ways mapped there (2 tagged as crossings). None carried `kerb`, `wheelchair` or `tactile_paving` tags.
- Mapillary coverage of the area (checked 25 Oct 2026): only 22 street-level images, 21 from 2014–2015 by one contributor and 1 from 2021. The field survey's Mapillary capture will be the first recent imagery of these streets.

## Checked facts (22 Oct 2026)
- 25 features in the study area had accessibility info in OSM: 24 with a `wheelchair` tag (15 yes, 7 no, 1 limited, 1 designated) and 1 with `tactile_paving=incorrect`. None had a `kerb` tag.

## Checked facts (25 Oct 2026): whole-city layers
- The Mapillary and OpenStreetMap layers now cover Vadodara and its near outskirts: 22.24–22.40 N, 73.10–73.27 E. The dashed outline on the map still shows the original core area.
- Mapillary: 721 street-level images in that box (the API allows 0.01 square degrees per request, so the map asks cell by cell, 0.05 degrees each). Most are in the north and east; the south-west has almost none.
- OpenStreetMap, same box: 62 wheelchair tags, 1 `tactile_paving` tag and no `kerb` tags among 166 mapped elements. Kerb height and tactile paving are almost entirely unmapped.
