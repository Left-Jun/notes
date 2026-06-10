create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  display_name text not null default 'limenauts',
  avatar_url text,
  status_emoji text default '*',
  status_text text default 'Profile online',
  bio text default '',
  social_links jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text default '',
  content_md text not null,
  section text not null default 'posts',
  tags text[] not null default '{}',
  mood text,
  mood_intensity smallint check (mood_intensity is null or (mood_intensity >= 0 and mood_intensity <= 100)),
  mood_privacy text not null default 'private' check (mood_privacy in ('private', 'anonymous', 'summary')),
  monster_id text,
  support_count integer not null default 0 check (support_count >= 0),
  location text,
  cover_url text,
  author_profile_id uuid references public.profiles(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notes
  add column if not exists mood_intensity smallint check (mood_intensity is null or (mood_intensity >= 0 and mood_intensity <= 100));

alter table public.notes
  add column if not exists mood_privacy text not null default 'private' check (mood_privacy in ('private', 'anonymous', 'summary'));

alter table public.notes
  add column if not exists monster_id text;

alter table public.notes
  add column if not exists support_count integer not null default 0 check (support_count >= 0);

alter table public.notes
  add column if not exists author_profile_id uuid references public.profiles(id) on delete set null;

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  author_name text not null,
  author_url text,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  created_at timestamptz not null default now()
);

create table if not exists public.mood_supports (
  id uuid primary key default gen_random_uuid(),
  note_id uuid references public.notes(id) on delete set null,
  note_slug text,
  monster_id text not null,
  action text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  mood text not null default 'recording',
  intensity smallint not null default 50 check (intensity >= 0 and intensity <= 100),
  core_reason text not null default '',
  next_action text not null default '',
  note text,
  tags text[] not null default '{}',
  privacy text not null default 'private' check (privacy in ('private', 'anonymous', 'summary')),
  monster_id text,
  support_count integer not null default 0 check (support_count >= 0),
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mood_encouragements (
  id uuid primary key default gen_random_uuid(),
  mood_entry_id uuid not null references public.mood_entries(id) on delete cascade,
  receiver_profile_id uuid not null references public.profiles(id) on delete cascade,
  sender_profile_id uuid references public.profiles(id) on delete set null,
  action text not null default 'support',
  message text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists notes_status_published_idx on public.notes(status, published_at desc);
create index if not exists notes_section_idx on public.notes(section, published_at desc);
create index if not exists notes_author_profile_idx on public.notes(author_profile_id, published_at desc);
create index if not exists profiles_auth_user_idx on public.profiles(auth_user_id);
create index if not exists comments_note_status_idx on public.comments(note_id, status, created_at asc);
create index if not exists mood_supports_note_idx on public.mood_supports(note_id, created_at desc);
create index if not exists mood_supports_monster_idx on public.mood_supports(monster_id, created_at desc);
create index if not exists mood_entries_profile_recorded_idx on public.mood_entries(profile_id, recorded_at desc);
create index if not exists mood_entries_public_idx on public.mood_entries(privacy, recorded_at desc) where privacy in ('anonymous', 'summary');
create index if not exists mood_encouragements_receiver_idx on public.mood_encouragements(receiver_profile_id, created_at desc);
create index if not exists mood_encouragements_entry_idx on public.mood_encouragements(mood_entry_id, created_at desc);

alter table public.notes enable row level security;
alter table public.profiles enable row level security;
alter table public.comments enable row level security;
alter table public.mood_supports enable row level security;
alter table public.mood_entries enable row level security;
alter table public.mood_encouragements enable row level security;

drop policy if exists "Profiles are readable" on public.profiles;
create policy "Profiles are readable"
on public.profiles for select
to anon, authenticated
using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = auth_user_id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

drop policy if exists "Published notes are readable" on public.notes;
create policy "Published notes are readable"
on public.notes for select
to anon, authenticated
using (status = 'published');

drop policy if exists "Approved comments are readable" on public.comments;
create policy "Approved comments are readable"
on public.comments for select
to anon, authenticated
using (status = 'approved');

drop policy if exists "Visitors can submit pending comments" on public.comments;
-- v1 keeps public comments closed until a moderation UI exists.

drop policy if exists "Mood supports are readable by service role only" on public.mood_supports;
-- Anonymous support actions are written through /api/mood/support with the service role.

drop policy if exists "Mood entries are readable by owner or public privacy" on public.mood_entries;
create policy "Mood entries are readable by owner or public privacy"
on public.mood_entries for select
to anon, authenticated
using (
  privacy in ('anonymous', 'summary')
  or exists (
    select 1 from public.profiles
    where profiles.id = mood_entries.profile_id
      and profiles.auth_user_id = auth.uid()
  )
);

drop policy if exists "Users can insert their own mood entries" on public.mood_entries;
create policy "Users can insert their own mood entries"
on public.mood_entries for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = mood_entries.profile_id
      and profiles.auth_user_id = auth.uid()
      and profiles.deleted_at is null
  )
);

drop policy if exists "Users can update their own mood entries" on public.mood_entries;
create policy "Users can update their own mood entries"
on public.mood_entries for update
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = mood_entries.profile_id
      and profiles.auth_user_id = auth.uid()
      and profiles.deleted_at is null
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = mood_entries.profile_id
      and profiles.auth_user_id = auth.uid()
      and profiles.deleted_at is null
  )
);

drop policy if exists "Users can delete their own mood entries" on public.mood_entries;
create policy "Users can delete their own mood entries"
on public.mood_entries for delete
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = mood_entries.profile_id
      and profiles.auth_user_id = auth.uid()
      and profiles.deleted_at is null
  )
);

drop policy if exists "Users can read received encouragements" on public.mood_encouragements;
create policy "Users can read received encouragements"
on public.mood_encouragements for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = mood_encouragements.receiver_profile_id
      and profiles.auth_user_id = auth.uid()
  )
);

drop policy if exists "Mood encouragements are written through API" on public.mood_encouragements;
-- Public encouragements are inserted through /api/mood/support with the service role.

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists notes_touch_updated_at on public.notes;
create trigger notes_touch_updated_at
before update on public.notes
for each row execute function public.touch_updated_at();

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists mood_entries_touch_updated_at on public.mood_entries;
create trigger mood_entries_touch_updated_at
before update on public.mood_entries
for each row execute function public.touch_updated_at();

create or replace function public.increment_note_support(target_note_id uuid)
returns integer as $$
declare
  next_count integer;
begin
  update public.notes
  set support_count = support_count + 1
  where id = target_note_id
  returning support_count into next_count;

  return coalesce(next_count, 0);
end;
$$ language plpgsql security definer;

create or replace function public.increment_mood_entry_support(target_entry_id uuid)
returns integer as $$
declare
  next_count integer;
begin
  update public.mood_entries
  set support_count = support_count + 1
  where id = target_entry_id
  returning support_count into next_count;

  return coalesce(next_count, 0);
end;
$$ language plpgsql security definer;

insert into storage.buckets (id, name, public)
values ('note-images', 'note-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('profile-avatars', 'profile-avatars', true)
on conflict (id) do nothing;

drop policy if exists "Public note images are readable" on storage.objects;
create policy "Public note images are readable"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'note-images');

drop policy if exists "Public profile avatars are readable" on storage.objects;
create policy "Public profile avatars are readable"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'profile-avatars');

drop policy if exists "Users can upload their own profile avatars" on storage.objects;
create policy "Users can upload their own profile avatars"
on storage.objects for insert
to authenticated
with check (bucket_id = 'profile-avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can update their own profile avatars" on storage.objects;
create policy "Users can update their own profile avatars"
on storage.objects for update
to authenticated
using (bucket_id = 'profile-avatars' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'profile-avatars' and auth.uid()::text = (storage.foldername(name))[1]);
