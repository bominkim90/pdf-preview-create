-- 2026-06-27: profiles 테이블, documents.author_id, anon RLS 제거 및 authenticated RLS 적용

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "authenticated read profiles"
  on profiles for select to authenticated using (true);

create policy "authenticated insert own profile"
  on profiles for insert to authenticated with check (id = auth.uid());

alter table documents
  add column if not exists author_id uuid references auth.users(id);

create index if not exists documents_author_id_idx on documents (author_id);

drop policy if exists "anon read all" on documents;
drop policy if exists "anon insert all" on documents;
drop policy if exists "anon update all" on documents;
drop policy if exists "anon delete all" on documents;

create policy "authenticated read documents"
  on documents for select to authenticated using (true);

create policy "authenticated insert own documents"
  on documents for insert to authenticated with check (author_id = auth.uid());

create policy "authenticated update own documents"
  on documents for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "authenticated delete own documents"
  on documents for delete to authenticated using (author_id = auth.uid());
