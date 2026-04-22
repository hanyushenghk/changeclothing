create table if not exists public.generated_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  image_url text not null,
  prompt text not null,
  created_at timestamptz not null default now()
);

create index if not exists generated_images_user_created_idx
  on public.generated_images (user_id, created_at desc);

alter table public.generated_images enable row level security;

create policy "Users can read own generated images"
  on public.generated_images
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own generated images"
  on public.generated_images
  for insert
  to authenticated
  with check (auth.uid() = user_id);
