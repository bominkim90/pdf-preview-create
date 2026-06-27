# Supabase DB migrations

프론트(Amplify)와 별도로, **이 폴더의 SQL이 DB 스키마의 원본**입니다.  
반영은 Supabase CLI로 직접 실행합니다 (`supabase db push`).

## 파일 이름 규칙

```
supabase/migrations/YYYYMMDDHHMMSS_설명.sql
```

| 부분 | 의미 | 예 |
|------|------|-----|
| `YYYYMMDDHHMMSS` | 14자리 타임스탬프 (Supabase CLI 필수) | `20260626120000` |
| `설명` | snake_case 짧은 설명 | `initial_documents` |

예: `20260626120000_initial_documents.sql`

같은 날 여러 번 변경하면 **시각을 다르게** 새 파일을 추가합니다.

```
20260626120000_initial_documents.sql
20260626153000_add_foo_column.sql
```

SQL **첫 줄 주석**에 날짜·주제를 한국어로 적습니다.

```sql
-- 2026-06-26: documents 테이블 생성, anon RLS, template_id 컬럼
```

## 적용 방법

```bash
# 최초 1회: Supabase CLI 설치 후 프로젝트 연결
# https://supabase.com/docs/guides/cli
supabase login
supabase link --project-ref <프로젝트-ref>

# migration 반영 (미적용분만 실행)
supabase db push
```

`link` / `repair` / `push` 시 `--project-ref`에는 꺾쇠 `<>` 없이 Project ID만 입력합니다.

## 이미 Supabase에 적용해 둔 migration

`20260626120000_initial_documents.sql` 은 SQL Editor로 **이미 적용한 내용**입니다.  
CLI를 처음 연결할 때 아래로 “적용 완료”만 표시하면 됩니다.

```bash
supabase migration repair 20260626120000 --status applied
```

(`repair`의 버전은 파일명 앞 **14자리 숫자**만 사용합니다.)

이후 스키마 변경은 **새 migration 파일**을 추가하고 `supabase db push` 하세요.  
**적용된 migration 파일은 수정하지 마세요.**

## 앱과의 대응

| DB | 앱 (`src/api/documents.js`) |
|----|-----------------------------|
| `documents.title` | 목록·저장 시 `getDocumentTitle(formData)` |
| `documents.template_id` | `formData.templateId` (기본 `report-default`) |
| `documents.form_data` | 폼 전체 JSON |
