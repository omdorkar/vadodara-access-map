# Method and limits

A one-page, honest description of how this map was made and what it can and cannot tell you.

## What the map is
A remote accessibility audit of Vadodara and its outskirts, with a small number of photographs taken by Om Dorkar. It is not a full survey of the city.

## Where the data comes from
| Layer on the map | Source | How much to trust it |
|---|---|---|
| **Field survey** (square pins) | Om's own photos, each showing the barrier it is labelled with | Seven records. Type and severity are Om's judgement from the photo. Kerb heights were not measured. |
| **Documentation only** (grey, dotted) | Om's photos that do not clearly show a footpath barrier, or were taken far from the city (Pavagadh Hill). Some carry a report from Om that the photo cannot show. | Context only. Not counted. |
| **AI-suggested (unverified)** (purple, off by default) | Mapillary street photos that a model (Claude) looked at and flagged | Low. Nobody has checked these on the ground. The photos are side-on views from a moving car. |
| **Mapillary photos** (green dots) | 721 street-level images across the city, mostly highways | Real imagery, CC-BY-SA, but mostly not footpaths. |
| **Already known in OSM / possible gaps** | OpenStreetMap tags | Other people's data. A "gap" means a missing tag, not a confirmed barrier. |

## What was not done
- No systematic walk. Om could not survey on foot, so there is no count of how many kerbs or crossings were checked, and no percentage.
- No measurements (kerb height, slope, width).
- No review by anyone who uses a wheelchair, pram or stick.
- Google Maps and Street View imagery was not used (its terms forbid copying it or analysing it).

## How the AI suggestions were made
A model looked through contact sheets of the Mapillary photos (about 280 of 721) and picked a few that seemed to show a broken or blocked roadside strip. The choices were not tested against any labelled set, so they can be wrong. They are shown to be checked, not trusted.

## How to improve it
1. People who live nearby confirm or reject each AI suggestion.
2. Volunteers send photos from their own streets (see PHOTO_GUIDE.md) and the survey grows from real photos.
3. Confirmed kerbs and entrances are added to OpenStreetMap so others can use them.
4. The street report goes to the city and to disability groups, and any reply is logged.
