-- Vadodara Access Map: shared, moderated barrier reports.
-- Run once: Supabase dashboard -> SQL Editor -> New query -> paste this file -> Run.
-- Visitors can only ADD reports (always as 'pending') and only READ approved ones.
-- Approving, rejecting and deleting happen in the dashboard, which uses the owner's login, not the public key.

create table if not exists public.reports (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  -- Rough Vadodara city bounds; anything outside is refused.
  lat         double precision not null check (lat between 22.20 and 22.42),
  lng         double precision not null check (lng between 73.05 and 73.30),
  cat         text not null check (cat in ('missing_ramp','broken_ramp','obstacle','uneven','no_tactile','stairs_only','lighting')),
  sev         text not null check (sev in ('high','med','low')),
  tags        jsonb not null default '{}'::jsonb check (jsonb_typeof(tags) = 'object' and length(tags::text) <= 500),
  descr       text not null default '' check (length(descr) <= 1000),
  mly_id      text check (mly_id ~ '^[0-9]{1,30}$'),
  mly_creator text check (length(mly_creator) <= 100),
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  review_note text
);

alter table public.reports enable row level security;

drop policy if exists "anyone can submit pending reports" on public.reports;
create policy "anyone can submit pending reports" on public.reports
  for insert to anon
  with check (status = 'pending' and review_note is null);

drop policy if exists "anyone can read approved reports" on public.reports;
create policy "anyone can read approved reports" on public.reports
  for select to anon
  using (status = 'approved');

-- Deliberately no update or delete policies for anon.

create index if not exists reports_status_created_idx on public.reports (status, created_at desc);
