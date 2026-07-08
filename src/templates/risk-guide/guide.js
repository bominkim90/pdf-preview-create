export const RISK_GUIDE_MD_GUIDE = `업무 리스크 관리 — MD 문법 가이드

# 문서 제목          → 제목 + 파란 구분선
---                  → YAML 메타 (작성자, 작성일)
:::summary           → 정의 박스 (연한 파란 배경)
## 소제목
문단 내용
:::
## 섹션 제목         → 본문 섹션
- 목록 항목
\`\`\`table:category  → 구분/내용 표 (2열)
@col1: 열1제목
@col2: 열2제목
구분 | 내용
\`\`\`
\`\`\`table:example   → 4열 표 (헤더 커스터마이즈 가능)
@grouptitle: 상위분류
@group: ① 첫열 | ② 둘째열
@col3: ③ 세번째열
@col4: ④ 네번째열
값1 | 값2 | 값3 | 값4
\`\`\`
\`\`\`table:items      → 항목 설명 표 (2열)
@col1: 항목
@col2: 항목 설명
항목 | 설명
\`\`\`
:::callout guide      → 안내 콜아웃
:::callout warn       → 주의 콜아웃
:::list remember      → "기억할 점" 목록
:::list notes         → 유의사항 목록
:::section-highlight  → 섹션 7 하이라이트
:::column-section     → ③④ 컬럼 가이드 블록

페이지 나눔은 자동 처리됩니다 (---page--- 불필요).

문서 헤더(제목·요약·작성자)는 편집기 상단 입력란에서 직접 편집합니다.
본문 MD에는 # 제목, --- 메타, :::summary 블록을 넣지 않아도 됩니다.

인라인 강조:
«텍스트»  → 파란 밑줄 강조 (정의 박스 등, risk-accent)
「텍스트」  → 밑줄 없는 인용 강조 (risk-quote)
‹텍스트›  → 파란 굵은 밑줄 강조 (risk-emphasis)
**텍스트** → 파란 굵은 밑줄 강조 (risk-underline-accent)

평문 입력 (rawSource):
// table:category|example|items  → 표 블록
// summary, // callout:guide, // list:remember 등 → 해당 블록
일반 | 파이프 | 표  → 자동 table 변환`;
