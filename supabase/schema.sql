create extension if not exists pgcrypto;

create table if not exists companies (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  domain text,
  logo_domain text,
  logo_background text,
  hourly_pay integer,
  num_submits integer,
  housing_perk text,
  signature_perk text,
  rating integer default 1200 not null,
  votes_won integer default 0 not null,
  total_matches integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists analytics_events (
  id uuid default gen_random_uuid() primary key,
  event_type text not null,
  path text,
  session_id text,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists leaderboard_snapshots (
  window_start timestamp with time zone primary key,
  rankings jsonb not null,
  total_count integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists analytics_events_event_type_created_at_idx
on analytics_events (event_type, created_at desc);

create index if not exists analytics_events_created_at_idx
on analytics_events (created_at desc);

create index if not exists leaderboard_snapshots_created_at_idx
on leaderboard_snapshots (created_at desc);

alter table companies add column if not exists domain text;
alter table companies add column if not exists logo_domain text;
alter table companies add column if not exists logo_background text;
alter table companies add column if not exists hourly_pay integer;
alter table companies add column if not exists num_submits integer;
alter table companies add column if not exists housing_perk text;
alter table companies add column if not exists signature_perk text;

alter table companies drop column if exists logo_url;
alter table companies drop column if exists slug;

alter table companies enable row level security;
alter table analytics_events enable row level security;
alter table leaderboard_snapshots enable row level security;

drop policy if exists "Allow public read access" on companies;
create policy "Allow public read access"
on companies
for select
using (true);

drop policy if exists "Allow public update access" on companies;
drop policy if exists "Allow public insert access" on analytics_events;
drop policy if exists "Allow public read access" on analytics_events;
drop policy if exists "Allow public read access" on leaderboard_snapshots;

create or replace function record_company_vote(
  winner_id uuid,
  loser_id uuid,
  k_factor integer default 32
)
returns table (
  winner_new_rating integer,
  loser_new_rating integer
)
language plpgsql
security definer
set search_path = public
set lock_timeout = '750ms'
set statement_timeout = '3000ms'
as $$
declare
  winner_current companies%rowtype;
  loser_current companies%rowtype;
  expected_winner numeric;
  expected_loser numeric;
begin
  if winner_id is null or loser_id is null then
    raise exception 'winner_id and loser_id are required';
  end if;

  if winner_id = loser_id then
    raise exception 'winner_id and loser_id must be different';
  end if;

  perform 1
  from companies
  where id in (winner_id, loser_id)
  order by id
  for update;

  select *
  into winner_current
  from companies
  where id = winner_id;

  select *
  into loser_current
  from companies
  where id = loser_id;

  if winner_current.id is null or loser_current.id is null then
    raise exception 'winner or loser was not found';
  end if;

  expected_winner :=
    1 / (1 + power(10, (loser_current.rating - winner_current.rating)::numeric / 400));

  expected_loser :=
    1 / (1 + power(10, (winner_current.rating - loser_current.rating)::numeric / 400));

  winner_new_rating :=
    round(winner_current.rating + k_factor * (1 - expected_winner));

  loser_new_rating :=
    round(loser_current.rating + k_factor * (0 - expected_loser));

  update companies
  set
    rating = winner_new_rating,
    votes_won = votes_won + 1,
    total_matches = total_matches + 1
  where id = winner_id;

  update companies
  set
    rating = loser_new_rating,
    total_matches = total_matches + 1
  where id = loser_id;

  return next;
end;
$$;

revoke execute on function record_company_vote(uuid, uuid, integer) from public;
revoke execute on function record_company_vote(uuid, uuid, integer) from anon;
revoke execute on function record_company_vote(uuid, uuid, integer) from authenticated;
grant execute on function record_company_vote(uuid, uuid, integer) to service_role;

create or replace function get_random_matchup()
returns setof companies
language sql
security definer
set search_path = public
set statement_timeout = '1500ms'
as $$
  select *
  from companies
  order by random()
  limit 2;
$$;

revoke execute on function get_random_matchup() from public;
revoke execute on function get_random_matchup() from anon;
revoke execute on function get_random_matchup() from authenticated;
grant execute on function get_random_matchup() to service_role;

-- Company rows are seeded from data/internships.csv with:
-- npm run seed:internships
