import "server-only"

/**
 * Idempotent Intopia Hub schema, applied once per server boot from instrumentation.ts.
 * Columns are quoted camelCase so rows map 1:1 onto the TypeScript domain types.
 * RLS is enabled on every table with NO policies: only the service role can access data.
 */
export const SCHEMA_SQL = /* sql */ `
create or replace function public.now_ms() returns bigint
language sql stable set search_path = '' as $$ select (extract(epoch from now()) * 1000)::bigint $$;

create table if not exists public.teams (
  "id" text primary key,
  "number" int not null unique check ("number" between 1 and 75),
  "name" text not null,
  "company" text,
  "region" text check ("region" in ('North America', 'Europe', 'China')),
  "whatsapp" text,
  "email" text unique,
  "equity" numeric,
  "kyc" text not null default 'unregistered' check ("kyc" in ('unregistered', 'pending', 'approved', 'rejected')),
  "certified" boolean not null default false,
  "banned" boolean not null default false,
  "registeredAt" bigint
);

create table if not exists public.team_credentials (
  "teamId" text primary key references public.teams("id") on delete cascade,
  "pinHash" text not null,
  "failedAttempts" int not null default 0,
  "lockedUntil" bigint,
  "createdAt" bigint not null default public.now_ms()
);

create table if not exists public.admin_account (
  "id" int primary key default 1 check ("id" = 1),
  "email" text not null,
  "passwordHash" text not null,
  "failedAttempts" int not null default 0,
  "lockedUntil" bigint,
  "createdAt" bigint not null default public.now_ms()
);

create table if not exists public.email_otps (
  "id" uuid primary key default gen_random_uuid(),
  "email" text not null,
  "purpose" text not null check ("purpose" in ('team-register', 'admin-setup')),
  "codeHash" text not null,
  "expiresAt" bigint not null,
  "attempts" int not null default 0,
  "verifiedAt" bigint,
  "createdAt" bigint not null default public.now_ms()
);
create index if not exists email_otps_lookup on public.email_otps ("email", "purpose", "createdAt" desc);

create table if not exists public.hub_settings (
  "id" int primary key default 1 check ("id" = 1),
  "period" text not null default 'P1',
  "tradingLocked" boolean not null default false,
  "deadlineAt" bigint
);
insert into public.hub_settings ("id") values (1) on conflict do nothing;

create table if not exists public.listings (
  "id" text primary key,
  "status" text not null check ("status" in ('OPEN', 'NEGOTIATING', 'PENDING_SIGNATURE', 'CLOSED')),
  "type" text not null check ("type" in ('BUY', 'SELL', 'PARTNERSHIP', 'RND')),
  "teamId" text not null references public.teams("id") on delete cascade,
  "title" text not null,
  "product" text not null check ("product" in ('X', 'Y')),
  "grade" int not null,
  "quantity" numeric,
  "unitPrice" numeric,
  "region" text not null,
  "delivery" text,
  "notes" text not null default '',
  "createdAt" bigint not null default public.now_ms()
);

create table if not exists public.threads (
  "id" text primary key,
  "listingId" text not null references public.listings("id") on delete cascade,
  "teamA" text not null references public.teams("id") on delete cascade,
  "teamB" text not null references public.teams("id") on delete cascade,
  "updatedAt" bigint not null default public.now_ms(),
  "closed" boolean not null default false
);

create table if not exists public.contracts (
  "id" text primary key,
  "threadId" text not null references public.threads("id") on delete cascade,
  "listingId" text not null references public.listings("id") on delete cascade,
  "kind" text not null check ("kind" in ('PRODUCT_SALE', 'PATENT_LICENSE', 'B2B_LOAN')),
  "initiatorId" text not null references public.teams("id"),
  "counterpartyId" text not null references public.teams("id"),
  "providerId" text not null references public.teams("id"),
  "product" text not null,
  "grade" int not null,
  "quantity" numeric not null,
  "unitPrice" numeric not null,
  "totalValue" numeric not null,
  "delivery" text,
  "region" text not null,
  "interestRate" numeric not null default 0,
  "cashPct" numeric not null,
  "ar1Pct" numeric not null,
  "ar2Pct" numeric not null,
  "status" text not null check ("status" in ('AWAITING', 'FINALIZED', 'COUNTERED', 'REJECTED')),
  "createdAt" bigint not null default public.now_ms(),
  "finalizedAt" bigint,
  "parentId" text,
  "revision" int not null default 1,
  "finalizedByAdmin" boolean,
  "adminOverridden" boolean
);

create table if not exists public.mr_offers (
  "id" text primary key,
  "threadId" text not null references public.threads("id") on delete cascade,
  "sellerId" text not null references public.teams("id"),
  "buyerId" text not null references public.teams("id"),
  "itemId" int not null,
  "area" text not null,
  "priceK" numeric not null,
  "status" text not null check ("status" in ('OFFERED', 'ACCEPTED', 'DECLINED')),
  "createdAt" bigint not null default public.now_ms()
);

create table if not exists public.messages (
  "id" text primary key,
  "threadId" text not null references public.threads("id") on delete cascade,
  "from" text not null,
  "text" text not null,
  "at" bigint not null default public.now_ms(),
  "contractId" text,
  "mrOfferId" text
);

create table if not exists public.ratings (
  "id" text primary key,
  "contractId" text not null references public.contracts("id") on delete cascade,
  "fromId" text not null references public.teams("id"),
  "toId" text not null references public.teams("id"),
  "stars" int not null check ("stars" between 1 and 5),
  "tags" jsonb not null default '[]',
  "at" bigint not null default public.now_ms(),
  unique ("contractId", "fromId")
);

create table if not exists public.shipments (
  "id" text primary key,
  "contractId" text references public.contracts("id") on delete cascade,
  "sellerId" text not null references public.teams("id"),
  "buyerId" text not null references public.teams("id"),
  "product" text not null,
  "grade" int not null,
  "quantity" numeric not null,
  "mode" text not null,
  "region" text not null
);

create table if not exists public.activity (
  "id" text primary key,
  "kind" text not null,
  "message" text not null,
  "teamId" text,
  "at" bigint not null default public.now_ms()
);
create index if not exists activity_at on public.activity ("at" desc);

create table if not exists public.announcements (
  "id" text primary key,
  "tag" text not null check ("tag" in ('Official', 'Reminder', 'Community')),
  "title" text not null,
  "body" text not null,
  "at" bigint not null default public.now_ms()
);

create table if not exists public.fines (
  "id" text primary key,
  "teamId" text not null references public.teams("id") on delete cascade,
  "amountK" numeric not null check ("amountK" > 0),
  "reason" text not null,
  "at" bigint not null default public.now_ms()
);

create table if not exists public.ai_reviews (
  "contractId" text primary key references public.contracts("id") on delete cascade,
  "score" int not null,
  "feeUSD" numeric not null,
  "warnings" jsonb not null default '[]',
  "strengths" jsonb not null default '[]'
);

insert into public.teams ("id", "number", "name")
select 't' || lpad(n::text, 2, '0'), n, 'Team ' || n from generate_series(1, 75) as n
on conflict do nothing;

do $$
declare t text;
begin
  foreach t in array array['teams','team_credentials','admin_account','email_otps','hub_settings','listings','threads',
    'contracts','mr_offers','messages','ratings','shipments','activity','announcements','fines','ai_reviews']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
`
