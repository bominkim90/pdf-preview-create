# 보고서 작성 시스템

사내용 보고서를 작성하고 A4 미리보기·PDF로 저장하는 웹 앱입니다.  
로그인 시 Supabase에 문서를 저장·목록 조회할 수 있고, `.txt`/`.md` 첨부 시 AI로 본문을 생성할 수 있습니다.

버전: `1.0.0 (alpha 1)`

---

## 서비스 이용

| 목적 | 경로 |
|------|------|
| PDF만 작성 (비로그인) | `/guest` |
| 회원가입 / 로그인 | `/signup`, `/login` |
| 새 문서 작성 | `/new` (로그인 필요) |
| 저장된 문서 목록 | `/documents` |
| 문서 편집 | `/edit/:id` |
| 계정·닉네임 관리 | `/mypage` |

가입 아이디는 `@istagingisa.com` 도메인으로 변환되어 Supabase Auth에 등록됩니다.

---

## 구성

별도 API 서버 없이 **브라우저 React 앱 + Supabase + OpenAI** 로 동작합니다.

```
[브라우저]  React (Vite)
    │
    ├─ AWS Amplify ── 정적 호스팅 (GitHub main push → 자동 빌드)
    │
    ├─ Supabase ──── Auth, Postgres (documents / profiles), RLS
    │
    └─ OpenAI ────── AI 본문 생성 (브라우저에서 직접 호출)
```

| 영역 | 역할 |
|------|------|
| 프론트 | 폼 입력 → 미리보기 → PDF 다운로드 / (로그인 시) DB 저장 |
| Supabase | 회원 인증, 문서·프로필 CRUD, Row Level Security |
| DB 스키마 | `supabase/migrations/` — CLI로 반영 (`supabase db push`) |

**권한:** 일반 사용자는 본인 문서만 수정·삭제. `master` 역할은 Supabase SQL로 지정 시 타인 문서도 수정 가능.

상세 스키마·RLS·라우팅: [`docs/기획_v2.md`](docs/기획_v2.md)  
DB migration 운영: [`supabase/README.md`](supabase/README.md)

---

## 사용법

### 로컬 개발

```bash
npm ci
cp .env.example .env   # 아래 환경 변수 값 입력
npm run dev
```

| 변수 | 용도 |
|------|------|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon(public) key |
| `VITE_OPENAI_API_KEY` | AI 본문 생성 (선택) |

---

## 배포

### 프론트 (Amplify)

1. GitHub 저장소를 Amplify에 연결 (`main` 브랜치)
2. 빌드 설정: 루트 [`amplify.yml`](amplify.yml) (`npm ci` → `npm run build` → `dist/`)
3. Amplify **Environment variables**에 `.env.example`과 동일한 3개 변수 설정
4. `main` push 시 자동 빌드·배포 (환경 변수 변경 후에는 **재배포** 필요)

### DB (Supabase)

앱 배포와 **별도**로 migration을 적용합니다.

```bash
supabase login
supabase link --project-ref <프로젝트-ref>
supabase db push
```

Supabase Dashboard (최초 1회): Authentication → Email 활성화, Confirm email 비활성화(프로토타입용).

---

## 주의사항

- **OpenAI API 키**는 Vite 빌드에 포함되어 브라우저에서 노출됩니다. 내부·소규모 사용 전제이며, 서버 프록xi는 미구현입니다.
- **AI 모델**은 env가 아니라 `src/constants/openAiModels.js` 상단 `ACTIVE_OPENAI_MODEL_ID` 상수로 지정합니다. 변경 후 재배포가 필요합니다.
- **`master` 역할**은 앱 UI에서 부여할 수 없습니다. Supabase SQL Editor에서 `profiles.role`을 수동 변경합니다.
- **DB migration**은 한 번 적용된 파일을 수정하지 말고, 새 migration 파일을 추가한 뒤 `db push` 하세요.
- **Amplify 배포**와 **Supabase migration**은 독립적입니다. 한쪽만 반영하면 앱·DB가 어긋날 수 있습니다.

---

## 관련 문서

- [기획·스키마·라우팅 상세](docs/기획_v2.md)
- [Supabase migration 가이드](supabase/README.md)
