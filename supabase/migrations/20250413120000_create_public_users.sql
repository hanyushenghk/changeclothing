-- public.users: app profile linked to Supabase Auth.
-- Do NOT add a password column here — credentials live in auth.users only.

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  userid text not null,
  name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_userid_key unique (userid)
);

create index if not exists users_email_idx on public.users (email);

create or replace function public.handle_users_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row
  execute procedure public.handle_users_updated_at();

alter table public.users enable row level security;

create policy "Users can read own row"
  on public.users
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own row"
  on public.users
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert own row"
  on public.users
  for insert
  to authenticated
  with check (auth.uid() = id);

-- Auto-create profile when a new auth user is registered (email, OAuth, etc.)
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_userid text;
  meta jsonb;
begin
  meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  base_userid := nullif(trim(coalesce(meta->>'userid', '')), '');

  if base_userid is null then
    base_userid := 'user_' || left(replace(new.id::text, '-', ''), 20);
  end if;

  insert into public.users (id, userid, name, email)
  values (
    new.id,
    base_userid,
    nullif(trim(coalesce(meta->>'name', meta->>'full_name', '')), ''),
    new.email
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_auth_user();
