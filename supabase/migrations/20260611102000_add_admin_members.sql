create table if not exists public.admin_members (
  email text primary key check (email = lower(trim(email)) and email like '%@%'),
  created_at timestamptz not null default now()
);

create index if not exists admin_members_email_idx on public.admin_members(email);

alter table public.admin_members enable row level security;

drop policy if exists "Admin members are service role managed" on public.admin_members;
-- Admin member records are managed through /api/admin/members with the service role.
