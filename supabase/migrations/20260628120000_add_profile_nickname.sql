-- 2026-06-28: profiles.nickname 컬럼 및 본인 프로필 수정 RLS

alter table profiles
  add column if not exists nickname text;

create policy "authenticated update own profile"
  on profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
