-- 2026-06-28: documents.author_id NOT NULL (작성자 필수)

-- 인증 도입 이전 등 author_id 없는 레거시 문서는 귀속 불가 → 삭제
delete from documents
where author_id is null;

alter table documents
  alter column author_id set not null;
