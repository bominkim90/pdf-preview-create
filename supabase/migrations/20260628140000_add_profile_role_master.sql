-- 2026-06-28: profiles.role (user | master), master 문서 수정/삭제 RLS

alter table profiles
  add column if not exists role text not null default 'user';

alter table profiles
  drop constraint if exists profiles_role_check;

alter table profiles
  add constraint profiles_role_check check (role in ('user', 'master'));

create or replace function public.is_master()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'master'
  );
$$;

revoke all on function public.is_master() from public;
grant execute on function public.is_master() to authenticated;

create or replace function public.profiles_guard_role()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() = new.id then
      new.role := 'user';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if auth.uid() = old.id and old.role is distinct from new.role then
      new.role := old.role;
    end if;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_role on profiles;
create trigger profiles_guard_role
  before insert or update on profiles
  for each row execute function public.profiles_guard_role();

drop policy if exists "authenticated update own documents" on documents;
drop policy if exists "authenticated delete own documents" on documents;

create policy "authenticated update own or master documents"
  on documents for update to authenticated
  using (author_id = auth.uid() or public.is_master())
  with check (author_id = auth.uid() or public.is_master());

create policy "authenticated delete own or master documents"
  on documents for delete to authenticated
  using (author_id = auth.uid() or public.is_master());
