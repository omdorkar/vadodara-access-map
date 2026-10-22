# Shared reports (Supabase): setup and reviewing

Without this, visitor reports stay in each visitor's own browser. With it, visitors can choose **"Share publicly"**. Their report goes into a free Supabase database as **pending**, and appears on the map for everyone only after you approve it.

Permanent facts (kerb height, tactile paving, step-only entrances) should go into **OpenStreetMap** instead. This database is for condition problems OSM doesn't hold: broken ramps, parked bikes, open drains.

## One-time setup (about 10 minutes)
1. Create a free account at https://supabase.com and click **New project**. Any name will do; pick the region closest to India. Save the database password somewhere safe; the site doesn't need it.
2. When the project is ready, open **SQL Editor → New query**. Paste all of [`supabase/schema.sql`](../supabase/schema.sql) and click **Run**. You should see "Success. No rows returned".
3. Open **Project Settings → API Keys** (or **API**) and copy two things:
   - the **Project URL**, like `https://abcd1234.supabase.co`
   - the **publishable** key (`sb_publishable_…`), or on older projects the **anon public** key (`eyJ…`)
4. Send those two to whoever maintains the site, or paste them into `SUPABASE_URL` and `SUPABASE_ANON_KEY` near the top of `index.html`.

**Never share or paste the `service_role` / secret key.** It bypasses all the protections below.

## What the protections do
- Visitors can only **add** reports, and only with status `pending`. They can only **read** reports with status `approved`.
- The database refuses reports outside Vadodara, unknown barrier types or severities, and notes over 1,000 characters.
- No names, emails or photos are collected. Visitor photos stay on the visitor's device.
- Approving, rejecting and deleting are only possible from your dashboard login.

## Reviewing reports (a few minutes, once or twice a week)
1. Open the project → **Table Editor → reports**.
2. Filter `status` = `pending`.
3. For each one, check that it's plausible. Is the location on a street? Do the type and note make sense? If there's a Mapillary id, look at the photo: `https://www.mapillary.com/app/?pKey=<mly_id>`.
4. Double-click the `status` cell and set it to `approved` or `rejected`. Optionally add a `review_note` for yourself.
5. Approved reports appear on the map, as "Community report (reviewed)", the next time the page loads.

Approving means "plausible", not "verified on the ground". The site says exactly that on each community report.

## Keep it awake
Supabase's free tier **pauses a project after about a week with no activity**. While the project is active, open the dashboard at least weekly; reviewing reports counts. If it pauses, the map keeps working, but new shared reports fall back to "saved in this browser" until you restore the project from the dashboard.
