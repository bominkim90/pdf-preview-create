-- 2026-06-26: documents 테이블 생성, anon RLS(select/insert/update), template_id 컬럼, delete 정책 추가

create table documents (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  form_data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table documents enable row level security;

create policy "anon read all"
  on documents for select to anon using (true);

create policy "anon insert all"
  on documents for insert to anon with check (true);

create policy "anon update all"
  on documents for update to anon using (true) with check (true);

alter table documents
  add column if not exists template_id text not null default 'report-default';

create policy "anon delete all"
  on documents for delete
  to anon
  using (true);
