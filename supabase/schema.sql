create extension if not exists pgcrypto;

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text default '',
  content_md text not null,
  section text not null default 'posts',
  tags text[] not null default '{}',
  mood text,
  location text,
  cover_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  author_name text not null,
  author_url text,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  created_at timestamptz not null default now()
);

create index if not exists notes_status_published_idx on public.notes(status, published_at desc);
create index if not exists notes_section_idx on public.notes(section, published_at desc);
create index if not exists comments_note_status_idx on public.comments(note_id, status, created_at asc);

alter table public.notes enable row level security;
alter table public.comments enable row level security;

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

insert into storage.buckets (id, name, public)
values ('note-images', 'note-images', true)
on conflict (id) do nothing;

drop policy if exists "Public note images are readable" on storage.objects;
create policy "Public note images are readable"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'note-images');
