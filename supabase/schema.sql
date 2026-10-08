-- GRECK. dashboard schema
-- Run once in Supabase → SQL Editor, then run seed.sql.
--
-- Security model: the site is static, so the Supabase anon key is public.
-- Every table has RLS on with NO policies, so the anon key can't read or
-- write tables directly. All access goes through the dash_* functions below,
-- which check a passcode first. Passcodes are stored bcrypt-hashed.

create extension if not exists pgcrypto with schema extensions;

-- ── Tables ──────────────────────────────────────────────────────────────

create table if not exists dash_users (
  role      text primary key check (role in ('brooke', 'kenzie')),
  code_hash text not null
);

create table if not exists phases (
  id           text primary key,
  name         text not null,
  tag          text not null default '',
  target_label text not null default '',
  target_date  date,
  sort         int  not null default 0
);

create table if not exists milestones (
  id       uuid primary key default gen_random_uuid(),
  label    text not null,
  date     date not null,
  end_date date,
  done     boolean not null default false,
  sort     int not null default 0
);

create table if not exists tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  phase_id     text references phases(id) on delete set null,
  owner        text not null default 'brooke' check (owner in ('brooke', 'kenzie', 'both')),
  due_date     date,
  status       text not null default 'not_started'
               check (status in ('not_started', 'in_progress', 'waiting_on', 'done')),
  notes        text not null default '',
  sort         int  not null default 0,
  completed_at timestamptz,
  updated_at   timestamptz not null default now(),
  updated_by   text
);

create table if not exists assets (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid references tasks(id) on delete cascade,
  label      text not null default '',
  url        text not null,
  added_by   text not null,
  created_at timestamptz not null default now()
);

create table if not exists links (
  id    uuid primary key default gen_random_uuid(),
  label text not null,
  url   text not null default '',
  sort  int  not null default 0
);

create table if not exists log (
  id         uuid primary key default gen_random_uuid(),
  author     text not null check (author in ('brooke', 'kenzie')),
  kind       text not null default 'note' check (kind in ('note', 'decision')),
  body       text not null,
  created_at timestamptz not null default now()
);

alter table dash_users enable row level security;
alter table phases     enable row level security;
alter table milestones enable row level security;
alter table tasks      enable row level security;
alter table assets     enable row level security;
alter table links      enable row level security;
alter table log        enable row level security;

-- ── Auth helpers ────────────────────────────────────────────────────────

create or replace function dash_role(p_code text) returns text
language sql stable security definer set search_path = public, extensions as $$
  select role from dash_users where code_hash = crypt(p_code, code_hash) limit 1;
$$;

create or replace function dash_auth(p_code text) returns text
language plpgsql stable security definer set search_path = public, extensions as $$
declare r text := dash_role(p_code);
begin
  if r is null then raise exception 'Wrong passcode' using errcode = '28P01'; end if;
  return r;
end $$;

create or replace function dash_admin(p_code text) returns text
language plpgsql stable security definer set search_path = public, extensions as $$
declare r text := dash_auth(p_code);
begin
  if r <> 'brooke' then raise exception 'Only Brooke can do that' using errcode = '42501'; end if;
  return r;
end $$;

-- Brooke runs this in the SQL editor to set or change a passcode:
--   select dash_set_passcode('kenzie', 'new-passcode-here');
create or replace function dash_set_passcode(p_role text, p_code text) returns void
language sql security definer set search_path = public, extensions as $$
  insert into dash_users (role, code_hash) values (p_role, crypt(p_code, gen_salt('bf')))
  on conflict (role) do update set code_hash = excluded.code_hash;
$$;

-- ── Read ────────────────────────────────────────────────────────────────

create or replace function dash_get(p_code text) returns jsonb
language plpgsql stable security definer set search_path = public, extensions as $$
declare r text := dash_auth(p_code);
begin
  return jsonb_build_object(
    'role',       r,
    'phases',     coalesce((select jsonb_agg(p order by p.sort) from phases p), '[]'),
    'milestones', coalesce((select jsonb_agg(m order by m.date, m.sort) from milestones m), '[]'),
    'tasks',      coalesce((select jsonb_agg(t order by t.sort) from tasks t), '[]'),
    'assets',     coalesce((select jsonb_agg(a order by a.created_at) from assets a), '[]'),
    'links',      coalesce((select jsonb_agg(l order by l.sort) from links l), '[]'),
    'log',        coalesce((select jsonb_agg(g order by g.created_at desc) from log g), '[]')
  );
end $$;

-- ── Tasks ───────────────────────────────────────────────────────────────

create or replace function dash_task_save(p_code text, p jsonb) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare
  r     text := dash_auth(p_code);
  v_id  uuid := nullif(p->>'id', '')::uuid;
  v_own text;
begin
  if r = 'kenzie' then
    -- Kenzie can update status and notes on tasks she owns (or shares).
    select owner into v_own from tasks where id = v_id;
    if v_own is null or v_own not in ('kenzie', 'both') then
      raise exception 'You can only update your own tasks' using errcode = '42501';
    end if;
    update tasks set
      status       = coalesce(p->>'status', status),
      notes        = coalesce(p->>'notes', notes),
      completed_at = case when coalesce(p->>'status', status) = 'done'
                          then coalesce(completed_at, now()) end,
      updated_at   = now(),
      updated_by   = r
    where id = v_id;
    return;
  end if;

  if v_id is null then
    insert into tasks (title, phase_id, owner, due_date, status, notes, sort, completed_at, updated_by)
    values (
      p->>'title',
      nullif(p->>'phase_id', ''),
      coalesce(p->>'owner', 'brooke'),
      nullif(p->>'due_date', '')::date,
      coalesce(p->>'status', 'not_started'),
      coalesce(p->>'notes', ''),
      coalesce((p->>'sort')::int, (select coalesce(max(sort), 0) + 1 from tasks)),
      case when p->>'status' = 'done' then now() end,
      r
    );
  else
    update tasks set
      title        = coalesce(p->>'title', title),
      phase_id     = case when p ? 'phase_id' then nullif(p->>'phase_id', '') else phase_id end,
      owner        = coalesce(p->>'owner', owner),
      due_date     = case when p ? 'due_date' then nullif(p->>'due_date', '')::date else due_date end,
      status       = coalesce(p->>'status', status),
      notes        = coalesce(p->>'notes', notes),
      completed_at = case when coalesce(p->>'status', status) = 'done'
                          then coalesce(completed_at, now()) end,
      updated_at   = now(),
      updated_by   = r
    where id = v_id;
  end if;
end $$;

create or replace function dash_task_delete(p_code text, p_id uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform dash_admin(p_code);
  delete from tasks where id = p_id;
end $$;

-- ── Assets (links attached to a task) ───────────────────────────────────

create or replace function dash_asset_add(p_code text, p_task uuid, p_label text, p_url text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare r text := dash_auth(p_code);
begin
  insert into assets (task_id, label, url, added_by) values (p_task, coalesce(p_label, ''), p_url, r);
end $$;

create or replace function dash_asset_delete(p_code text, p_id uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare r text := dash_auth(p_code);
begin
  delete from assets where id = p_id and (r = 'brooke' or added_by = r);
end $$;

-- ── Milestones & phases (Brooke only) ───────────────────────────────────

create or replace function dash_milestone_save(p_code text, p jsonb) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid := nullif(p->>'id', '')::uuid;
begin
  perform dash_admin(p_code);
  if v_id is null then
    insert into milestones (label, date, end_date, done, sort)
    values (p->>'label', (p->>'date')::date, nullif(p->>'end_date', '')::date,
            coalesce((p->>'done')::boolean, false), coalesce((p->>'sort')::int, 99));
  else
    update milestones set
      label    = coalesce(p->>'label', label),
      date     = coalesce((p->>'date')::date, date),
      end_date = case when p ? 'end_date' then nullif(p->>'end_date', '')::date else end_date end,
      done     = coalesce((p->>'done')::boolean, done)
    where id = v_id;
  end if;
end $$;

create or replace function dash_milestone_delete(p_code text, p_id uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform dash_admin(p_code);
  delete from milestones where id = p_id;
end $$;

create or replace function dash_phase_save(p_code text, p jsonb) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform dash_admin(p_code);
  update phases set
    name         = coalesce(p->>'name', name),
    tag          = coalesce(p->>'tag', tag),
    target_label = coalesce(p->>'target_label', target_label),
    target_date  = coalesce((p->>'target_date')::date, target_date)
  where id = p->>'id';
end $$;

-- ── Links (both can edit URLs; Brooke can add/delete) ───────────────────

create or replace function dash_link_save(p_code text, p jsonb) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare
  r    text := dash_auth(p_code);
  v_id uuid := nullif(p->>'id', '')::uuid;
begin
  if v_id is null then
    perform dash_admin(p_code);
    insert into links (label, url, sort)
    values (p->>'label', coalesce(p->>'url', ''), (select coalesce(max(sort), 0) + 1 from links));
  else
    update links set label = coalesce(p->>'label', label), url = coalesce(p->>'url', url)
    where id = v_id;
  end if;
end $$;

create or replace function dash_link_delete(p_code text, p_id uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform dash_admin(p_code);
  delete from links where id = p_id;
end $$;

-- ── Notes & decisions log ───────────────────────────────────────────────

create or replace function dash_log_add(p_code text, p_kind text, p_body text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare r text := dash_auth(p_code);
begin
  insert into log (author, kind, body) values (r, coalesce(p_kind, 'note'), p_body);
end $$;

create or replace function dash_log_delete(p_code text, p_id uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare r text := dash_auth(p_code);
begin
  delete from log where id = p_id and (r = 'brooke' or author = r);
end $$;

-- ── Permissions ─────────────────────────────────────────────────────────
-- Only the public dash_* entry points are callable from the website.

revoke all on all functions in schema public from public, anon, authenticated;
grant execute on function
  dash_role(text),
  dash_get(text),
  dash_task_save(text, jsonb),
  dash_task_delete(text, uuid),
  dash_asset_add(text, uuid, text, text),
  dash_asset_delete(text, uuid),
  dash_milestone_save(text, jsonb),
  dash_milestone_delete(text, uuid),
  dash_phase_save(text, jsonb),
  dash_link_save(text, jsonb),
  dash_link_delete(text, uuid),
  dash_log_add(text, text, text),
  dash_log_delete(text, uuid)
to anon;
