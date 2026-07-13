create extension if not exists pgcrypto;

create table if not exists companies (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  logo_url text not null,
  rating integer default 1200 not null,
  votes_won integer default 0 not null,
  total_matches integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table companies add column if not exists logo_url text;

update companies
set logo_url = 'https://thesvg.org/icons/' ||
  case name
    when 'Google' then 'google'
    when 'Apple' then 'apple'
    when 'Microsoft' then 'microsoft'
    when 'Meta' then 'meta'
    when 'Netflix' then 'netflix'
    when 'Stripe' then 'stripe'
    when 'OpenAI' then 'openai'
    when 'SpaceX' then 'spacex'
    when 'Nvidia' then 'nvidia'
    when 'Vercel' then 'vercel'
    when 'Airbnb' then 'airbnb'
    when 'Uber' then 'uber'
    else lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
  end || '/' ||
  case name
    when 'Apple' then 'light'
    when 'Nvidia' then 'light'
    when 'OpenAI' then 'light'
    when 'Vercel' then 'light'
    when 'Uber' then 'light'
    else 'default'
  end || '.svg'
where
  logo_url is null
  or logo_url = ''
  or logo_url like 'https://logo.clearbit.com/%'
  or logo_url like 'https://cdn.jsdelivr.net/gh/gilbarbara/logos@main/logos/%';

alter table companies alter column logo_url set not null;
alter table companies drop column if exists slug;

alter table companies enable row level security;

drop policy if exists "Allow public read access" on companies;
create policy "Allow public read access"
on companies
for select
using (true);

drop policy if exists "Allow public update access" on companies;

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

with seed_companies (name, slug, logo_variant, rating) as (
  values
    ('Google', 'google', 'default', 1200),
    ('Apple', 'apple', 'light', 1200),
    ('Microsoft', 'microsoft', 'default', 1200),
    ('Meta', 'meta', 'default', 1200),
    ('Netflix', 'netflix', 'default', 1200),
    ('Stripe', 'stripe', 'default', 1200),
    ('OpenAI', 'openai', 'light', 1200),
    ('SpaceX', 'spacex', 'default', 1200),
    ('Nvidia', 'nvidia', 'light', 1200),
    ('Vercel', 'vercel', 'light', 1200),
    ('Airbnb', 'airbnb', 'default', 1200),
    ('Uber', 'uber', 'light', 1200)
)
insert into companies (name, logo_url, rating)
select
  name,
  'https://thesvg.org/icons/' || slug || '/' || logo_variant || '.svg',
  rating
from seed_companies
on conflict (name) do update
set logo_url = excluded.logo_url;
