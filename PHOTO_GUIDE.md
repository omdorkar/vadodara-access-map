# Field survey photo guide

This is a one-page guide for taking photos, whether Om takes them or a volunteer sends them in. These photos are the project's real evidence, so they matter more than anything else on the site. A photo only counts as a finding if **it shows the barrier**. If you only know a barrier is there, say so in the note and the pin is marked as a report.

## Before you go (one-time setup)
- **OpenStreetMap account** (2 min): sign up at https://www.openstreetmap.org/user/new. After the walk, the kerbs and entrances you checked can be added to OSM under this name. Every edit is public and dated.
- **Mapillary**: create an account at https://www.mapillary.com and install the Mapillary app. Run it during the walk (below).
- **Turn on camera location.** iPhone: Settings → Privacy & Security → Location Services → Camera → "While Using". Android: Camera app settings → "Location tags" on.
- Test it: take one photo, open it in Photos, swipe up. You should see a map. If there's no map, location is off.
- Pick 2–3 streets anywhere in Vadodara. Aim for **20–30 photos**, and photograph every kerb or crossing on them, not only the bad ones, so we can say how many were checked.
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

## Also: record the route with the Mapillary app
Separately from the barrier photos, walk each street once with the **Mapillary app** in capture mode. Hold the phone upright at chest height, facing forward, or clip it to a bike. It takes a geotagged photo every few metres. Upload when you're back on Wi-Fi.
- This gives hundreds of street-level images of the route. They show up on the map's green "Mapillary photos" layer by themselves.
- Later it is the raw material for training a barrier detector.
- Mapillary publishes uploads under CC-BY-SA and blurs faces and number plates automatically.

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
osascript -l JavaScript tools/process_photos.js "$PWD"
```
This makes web-sized copies with all phone metadata removed, puts each photo on the map at its GPS location, and lists any photos that have no location. Originals are never uploaded.

## After the walk: add what you saw to OpenStreetMap
Open a barrier on the live map and tap **Add to OSM with MapComplete**. That opens the same spot in MapComplete OnWheels, where you can answer questions like "How high is this kerb?" or "Is there tactile paving?" while logged in with your OSM account.
- Only add what you saw yourself on the ground.
- Never copy from Google Maps or Street View.
- Keep each session small.
