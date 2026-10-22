# Data sources

Every source used on the site, with its licence and how it is used. Anything not from the field survey is labelled on the map.

| Source | What we use | Licence | How it's used / attribution |
|---|---|---|---|
| Field survey (this project) | Geotagged photos and notes from a walk of the study area | CC-BY-SA 4.0, credited to the surveyor on each pin | Shown as "Field survey" pins. Web copies have all metadata removed. Originals are not published. |
| [OpenStreetMap](https://www.openstreetmap.org/copyright) | Street map tiles; footway/crossing geometry and tags via the [Overpass API](https://overpass-api.de/) | ODbL 1.0 (data), tiles under the [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/) | Base map, the "already known in OSM" layer, and the "possible gap (unverified)" layer. Derived gap data stays ODbL, not CC-BY-SA. Credit: "© OpenStreetMap contributors". |
| [Esri World Imagery](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9) | Satellite tiles | Esri terms of use; display only, no download or tracing for redistribution | Satellite toggle. Credit: "Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community". |
| [Nominatim](https://nominatim.org/) (OpenStreetMap) | Street and area name for each survey photo, looked up once when photos are processed | ODbL 1.0 (OSM data); used within the [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/) (1 request/s, identified) | Shown as the street heading in the report. Can be corrected by hand. |
| [OpenStreetMap API](https://wiki.openstreetmap.org/wiki/API_v0.6) | Public edit count for the project's OSM account | ODbL 1.0 | "N edits to OpenStreetMap" line in About. |
| [Mapillary](https://www.mapillary.com/) | Street-level photos fetched live via the Graph API | CC-BY-SA 4.0 | Shown live with author name and link back. Images are not copied into this repo. |
| Sample data (this project) | 16 invented example reports at approximate locations | CC-BY-SA 4.0 | Labelled "Sample data" everywhere. Not findings. Hidden automatically once survey data exists. |

## Not used
- **Google Maps / Google Earth / Street View imagery or screenshots.** Google's terms forbid copying and redistributing it.
- **Data from other cities** (e.g. Project Sidewalk, RDD2022, Roboflow or Kaggle sets). These are only considered for later model training, would be listed here with their exact licence, and would never be shown as Vadodara findings.

## Checked facts (18 Oct 2026)
- Study-area bounding box: 22.298–22.322 N, 73.160–73.200 E.
- OSM had 26 footway ways mapped there (2 tagged as crossings). None carried `kerb`, `wheelchair` or `tactile_paving` tags.
- Mapillary coverage of the area has not been checked yet (needs a client token).

## Checked facts (22 Oct 2026)
- 25 features in the study area had accessibility info in OSM: 24 with a `wheelchair` tag (15 yes, 7 no, 1 limited, 1 designated) and 1 with `tactile_paving=incorrect`. None had a `kerb` tag.
