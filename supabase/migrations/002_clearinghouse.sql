-- Intopia Hub · Platform overhaul (idempotent; safe to re-run).
-- Run in the Supabase SQL Editor after schema.sql.

-- Team profile, onboarding, promo and intrusion protection.
alter table public.teams add column if not exists "team_members" jsonb not null default '[]'::jsonb;
alter table public.teams add column if not exists "team_leader_name" text;
alter table public.teams add column if not exists "contact_email" text;
alter table public.teams add column if not exists "promo_code_used" text;
alter table public.teams add column if not exists "promo_redeemed_at" bigint;
alter table public.teams add column if not exists "security_flag_count" int not null default 0;
alter table public.teams add column if not exists "last_intrusion_reported_at" timestamptz;
alter table public.teams add column if not exists "login_locked_until" bigint;

-- Read-only snake_case aliases so external tools can query team_id / team_number / official_email.
alter table public.teams add column if not exists "team_id" text generated always as ("id") stored;
alter table public.teams add column if not exists "team_number" int generated always as ("number") stored;
alter table public.teams add column if not exists "official_email" text
  generated always as ('ott' || lpad("number"::text, 2, '0') || '@intopsim.com') stored;
alter table public.teams add column if not exists "kyc_status" text generated always as ("kyc") stored;
alter table public.teams add column if not exists "whatsapp_number" text generated always as ("whatsapp") stored;
alter table public.teams add column if not exists "waiver_signed" boolean generated always as (coalesce("certified", false)) stored;
alter table public.teams add column if not exists "waiver_signed_at" timestamptz
  generated always as (to_timestamp("waiverAt" / 1000.0)) stored;

-- Marketplace is now Buy / Sell / Other (legacy values kept so old rows stay valid).
alter table public.listings drop constraint if exists "listings_type_check";
alter table public.listings add constraint "listings_type_check" check ("type" in ('BUY', 'SELL', 'OTHER', 'PARTNERSHIP', 'RND'));

-- Escrow Protection Fee recorded per contract (0 while INTOPIATRIAL waiver is active).
alter table public.contracts add column if not exists "clearing_fee" numeric not null default 0;
alter table public.contracts add column if not exists "fee_waived" boolean not null default false;

-- Free-form team-to-team chat with capped attachments.
create table if not exists public.chat_messages (
  "id" text primary key,
  "fromTeam" text not null references public.teams("id") on delete cascade,
  "toTeam" text not null references public.teams("id") on delete cascade,
  "body" text not null default '',
  "attachmentPath" text,
  "attachmentName" text,
  "attachmentSize" int check ("attachmentSize" is null or "attachmentSize" <= 2097152),
  "attachmentMime" text,
  "createdAt" bigint not null
);
create index if not exists chat_messages_pair_idx on public.chat_messages ("fromTeam", "toTeam", "createdAt");

-- Ratings at any stage, one live rating per (rater, rated) pair.
create table if not exists public.team_ratings (
  "id" text primary key,
  "fromTeam" text not null references public.teams("id") on delete cascade,
  "toTeam" text not null references public.teams("id") on delete cascade,
  "stars" int not null check ("stars" between 1 and 5),
  "comment" text not null default '',
  "stage" text not null check ("stage" in ('inquiry', 'negotiation', 'post_contract')),
  "createdAt" bigint not null,
  unique ("fromTeam", "toTeam")
);

alter table public.chat_messages enable row level security;
alter table public.team_ratings enable row level security;

-- Private bucket for chat files; 2 MB hard cap enforced by storage too.
insert into storage.buckets ("id", "name", "public", "file_size_limit", "allowed_mime_types")
values (
  'chat-attachments', 'chat-attachments', false, 2097152,
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']
)
on conflict ("id") do update set "file_size_limit" = excluded."file_size_limit", "allowed_mime_types" = excluded."allowed_mime_types";
