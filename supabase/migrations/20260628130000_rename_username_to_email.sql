-- 2026-06-28: profiles.username → email (전체 이메일 주소 저장)

alter table profiles rename column username to email;

-- 로컬 파트만 저장된 기존 데이터를 전체 이메일로 보정
update profiles
set email = lower(email) || '@istagingisa.com'
where email is not null
  and position('@' in email) = 0;
