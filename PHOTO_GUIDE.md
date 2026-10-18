# Field survey photo guide

This is a one-page guide for the photo walk. These photos are the project's real evidence, so they matter more than anything else on the site.

## Before you go
- **Turn on camera location.** iPhone: Settings → Privacy & Security → Location Services → Camera → "While Using". Android: Camera app settings → "Location tags" on.
- Test it: take one photo, open it in Photos, swipe up. You should see a map. If there's no map, location is off.
- Pick 2–3 streets in the study area (Alkapuri, Sayaji Baug, around the railway station). Aim for **20–30 photos**.
- Go in daylight and with a friend if you can.

## What to photograph
| Type (use this word in notes) | What it looks like |
|---|---|
| `missing_ramp` | High kerb at a crossing or entrance with no dropped kerb or ramp |
| `broken_ramp` | Ramp that is cracked, crumbling, too steep, or ends in a step |
| `obstacle` | Parked vehicles, vendor carts, signboards, poles or trees blocking the footpath |
| `uneven` | Broken slabs, open or missing drain covers, big height changes |
| `no_tactile` | Busy crossing or station entrance with no yellow tactile paving, or tactile paving that is broken |
| `stairs_only` | Public entrance (bank, shop, office, temple, station) with steps and no ramp |
| `lighting` | Footpath or underpass that is very dark at night |

For each barrier take **2 photos**: one **wide** (shows where it is) and one **close-up** (shows the problem). Stand where the barrier is, because the photo's GPS is where *you* are.

**Severity** (use in notes): `high` = a wheelchair user cannot get past · `med` = possible but hard or unsafe · `low` = inconvenient.

## Privacy and safety
- Shoot only from public footpaths. Don't go into private property.
- Avoid clear faces and readable number plates. Wait for people to pass, or frame them out.
- Don't stand in traffic for a shot.

## Notes (on your phone, while you walk)
Write one line per barrier. You can add the photo filenames afterwards:
```
file,type,severity,note
IMG_1234.HEIC,missing_ramp,high,No dropped kerb at the crossing outside the bank
IMG_1236.HEIC,obstacle,med,Bikes parked across the whole footpath
```
Save it as `photos/notes.csv`. See `photos/notes-template.csv`.

## Getting photos to the laptop
- **Do:** AirDrop (tap "Options" → turn on "All Photos Data"), a USB cable, or Google Drive / Google Photos download at **original quality**.
- **Don't:** WhatsApp, Instagram or screenshots. They remove the GPS location.
- Put the files in `photos/originals/`. HEIC is fine.

## Then run (from the project folder)
```
osascript -l JavaScript tools/process_photos.js "$PWD" "Om <surname>"
```
This makes web-sized copies with all phone metadata removed, puts each photo on the map at its GPS location, and lists any photos that have no location. Originals are never uploaded.

## Optional: also upload to Mapillary
Uploading the same photos through the Mapillary app makes them public street imagery (CC-BY-SA). That adds a second, independent public record of the survey.
