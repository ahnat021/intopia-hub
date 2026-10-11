-- Intopia Hub: fresh-season reset. Run in the Supabase SQL Editor AFTER schema.sql.
-- Keeps: the admin login (admin_account) and Team 25's account + login (t25).
-- Clears: every other team's registration/login (including the Team 1 test),
-- all listings, deals, contracts, messages, shipments, activity, announcements,
-- fines and pending email codes. Resets the game calendar to its defaults.
-- WARNING: this permanently deletes data.

begin;

delete from public.ai_reviews;
delete from public.fines;
delete from public.announcements;
delete from public.activity;
delete from public.shipments;
delete from public.ratings;
delete from public.messages;
delete from public.mr_offers;
delete from public.contracts;
delete from public.threads;
delete from public.listings;
delete from public.email_otps;

delete from public.team_credentials where "teamId" <> 't25';

update public.teams set
  "name" = case when "id" = 'prof' then 'Professor Tim' else 'Team ' || "number" end,
  "company" = null,
  "region" = null,
  "whatsapp" = null,
  "email" = null,
  "equity" = null,
  "kyc" = 'unregistered',
  "certified" = false,
  "banned" = false,
  "registeredAt" = null,
  "waiverName" = null,
  "waiverAt" = null
where "id" <> 't25';

-- Team 25 keeps its login but signs the new rules waiver like everyone else.
update public.teams set "certified" = false, "waiverName" = null, "waiverAt" = null where "id" = 't25';

insert into public.teams ("id", "number", "name") values ('prof', 0, 'Professor Tim')
on conflict do nothing;

delete from public.hub_settings;
insert into public.hub_settings ("id") values (1);

commit;
