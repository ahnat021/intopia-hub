-- 003_fixes.sql — run manually in the Supabase SQL editor. Safe to re-run.

alter table public.teams add column if not exists team_number int;
alter table public.teams add column if not exists official_email text;
alter table public.teams add column if not exists kyc_status text default 'unregistered';
alter table public.teams add column if not exists waiver_signed boolean not null default false;
alter table public.teams add column if not exists waiver_signed_at timestamptz;
alter table public.teams add column if not exists promo_code_used text;
alter table public.teams add column if not exists team_leader_name text;
alter table public.teams add column if not exists team_members jsonb not null default '[]'::jsonb;
alter table public.teams add column if not exists whatsapp_number text;
alter table public.teams add column if not exists contact_email text;
alter table public.teams add column if not exists security_flag_count int not null default 0;
alter table public.teams add column if not exists last_intrusion_reported_at timestamptz;

-- Backfill team_number / official_email (ott01..ott75@intopsim.com) from the existing "number" column.
update public.teams
set team_number = coalesce(team_number, "number"),
    official_email = coalesce(official_email, 'ott' || lpad("number"::text, 2, '0') || '@intopsim.com')
where "number" between 1 and 75;

alter table public.teams drop constraint if exists teams_team_number_range;
alter table public.teams add constraint teams_team_number_range check (team_number is null or team_number between 1 and 75);

-- Active period follows the official calendar (Market Test Period 4, due Oct 14 2026 22:00 EDT).
update public.hub_settings set period = 'AUTO' where id = 1;
