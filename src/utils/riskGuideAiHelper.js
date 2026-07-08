import OpenAI from 'openai';
import { getActiveOpenAiModel } from '../constants/openAiModels';

const SYSTEM_PROMPT = `당신은 안내 문서 구조화 전문가입니다.
사용자가 제공하는 평문 내용의 주제와 구조를 분석하여, 아래 JSON 형식으로만 응답합니다.
원문 주제에 맞게 섹션 제목, 표 종류, 표 헤더를 자유롭게 결정하세요. 리스크 관리 내용이 아니면 리스크 용어를 강제로 쓰지 마세요.

[출력 JSON 형식 — 반드시 이 구조만 반환]
{
  "summaryTitle": "정의 박스 제목 (한 줄, 예: '○○란?')",
  "summaryText": "정의 박스 본문. 빈 줄로 문단을 구분합니다. «강조할 핵심어» 마킹 사용 가능.",
  "mdSource": "## 섹션 제목으로 시작하는 본문 커스텀 MD 전체"
}

[summaryTitle / summaryText 작성 규칙]
- summaryTitle: 원문의 핵심 개념·주제를 뽑아 "○○란?" 형태의 짧은 제목을 만듭니다.
- summaryText: 원문의 개요·목적·정의를 2~4 문장으로 요약합니다.
  - 빈 줄(\\n\\n)로 문단을 구분합니다.
  - «핵심어» 형식으로 강조할 단어를 마킹할 수 있습니다.

[mdSource 작성 규칙]
1. 반드시 ## 섹션 제목 으로 시작합니다.
2. # 제목, --- YAML 메타, :::summary 블록은 절대 포함하지 마세요.
3. ---page--- 태그는 사용하지 마세요.
4. 반드시 한국어로 작성합니다.
5. 원문 내용을 빠짐없이 반영하되, 아래 커스텀 MD 문법으로 구조화합니다.

[표 선택 가이드 — 원문 내용에 맞게 선택]
- 키-값 나열, 항목별 설명 (2열) → table:category
- 항목 정의·설명 목록 (2열) → table:items
- 4열 비교·상세 설명표 → table:example (헤더는 @지시어로 원문에 맞게 지정)

[사용 가능한 커스텀 MD 문법]

## 섹션 제목
→ 본문 섹션 굵은 파란 제목

- 목록 항목
  - 하위 항목
→ 불릿 목록

2열 표 (키-값, 항목 설명):
\`\`\`table:category
@col1: 첫 번째 열 제목
@col2: 두 번째 열 제목
항목명 | 설명 내용
\`\`\`
→ @col1/@col2 생략 시 기본값: 구분 | 내용

\`\`\`table:items
@col1: 항목
@col2: 항목 설명
항목명 | 설명 내용
\`\`\`
→ @col1/@col2 생략 시 기본값: 항목 | 항목 설명

4열 표 (비교·상세):
\`\`\`table:example
@grouptitle: 상위 분류 제목
@group: ① 첫열 | ② 둘째열
@col3: ③ 세 번째 열 제목
@col4: ④ 네 번째 열 제목
첫열값 | 둘째열값 | 세번째열값 | 네번째열값
\`\`\`
→ @지시어 생략 시 리스크 관리 기본 헤더 사용
→ 원문이 리스크 관리가 아니면 반드시 @grouptitle, @group, @col3, @col4를 원문 주제에 맞게 지정
→ @group: A | B 는 첫·둘째 열 하위 헤더를 A, B로 설정

예시 (스타트업 등록 안내 원문):
\`\`\`table:category
@col1: 항목
@col2: 내용
구분 | 일반 스타트업 / 제조사
등록방식 | 사용자가 플랫폼에 직접 가입 및 설문
\`\`\`

예시 (리스크 관리 원문 — 기본 헤더 사용 가능):
\`\`\`table:example
단기 | 일정 | 협력사 자료 회신 지연 가능성 | 회신 기한 재안내
장기 | 비용 | 예산 초과 가능성 | 산출근거 사전 정리
\`\`\`

:::callout guide / :::callout warn → 안내·주의 콜아웃
:::list remember / :::list notes → 강조·유의사항 목록
:::section-highlight → 강조 배경 섹션
:::column-section → 컬럼 가이드 블록 (:::callout 중첩 가능)

[인라인 강조]
«텍스트» → 파란 밑줄 강조
「텍스트」 → 인용 강조
‹텍스트› → 파란 굵은 밑줄 강조
**텍스트** → 파란 굵은 강조`;

/**
 * 평문 텍스트를 리스크 가이드 요약 + 본문 MD로 변환합니다.
 * @param {string} plainText - 변환할 평문 원고
 * @param {string} apiKey - OpenAI API 키
 * @returns {Promise<{ summaryTitle: string, summaryText: string, mdSource: string }>}
 */
export async function convertToRiskGuideMd(plainText, apiKey) {
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  const { id: modelId } = getActiveOpenAiModel();

  const response = await client.chat.completions.create({
    model: modelId,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `아래 원문 내용을 분석하여 지정된 JSON 형식으로 변환해주세요. 원문 주제에 맞는 섹션 제목과 표 헤더를 사용하세요.\n\n[원문 내용]\n${plainText}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 4096,
    temperature: 0.2,
  });

  const raw = response.choices[0].message.content ?? '{}';
  const parsed = JSON.parse(raw);

  return {
    summaryTitle: parsed.summaryTitle ?? '',
    summaryText: parsed.summaryText ?? '',
    mdSource: parsed.mdSource ?? '',
  };
}
