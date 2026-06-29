/** 사용할 OpenAI 모델 — 아래 OPENAI_MODEL_OPTIONS의 id 중 하나로 설정 */
export const ACTIVE_OPENAI_MODEL_ID = 'gpt-4o-mini';

/** OpenAI Chat Completions 모델 목록 (id는 API model 파라미터 값) */
export const OPENAI_MODEL_OPTIONS = [
  {
    id: 'gpt-4.1-mini',
    description: 'GPT-4.1 Mini — 4o-mini보다 지시·한국어 품질 ↑, 비용 중간 (내부 보고서용 추천)',
  },
  {
    id: 'gpt-4o-mini',
    description: 'GPT-4o Mini — 가장 저렴, 짧은 자료·테스트용 (품질은 기본 수준)',
  },
  {
    id: 'gpt-4.1-nano',
    description: 'GPT-4.1 Nano — 초저가·빠름, 품질은 mini보다 낮을 수 있음',
  },
  {
    id: 'gpt-4o',
    description: 'GPT-4o — 품질 최상급, 출력 단가 높음 (호출 적을 때)',
  },
  {
    id: 'gpt-4.1',
    description: 'GPT-4.1 — 4o보다 코딩·지시 따르기 강화, 비용 높음',
  },
];

export function getOpenAiModelOption(modelId) {
  return (
    OPENAI_MODEL_OPTIONS.find((option) => option.id === modelId) ??
    OPENAI_MODEL_OPTIONS.find((option) => option.id === ACTIVE_OPENAI_MODEL_ID)
  );
}

export function getActiveOpenAiModel() {
  const isValid = OPENAI_MODEL_OPTIONS.some((option) => option.id === ACTIVE_OPENAI_MODEL_ID);
  const modelId = isValid ? ACTIVE_OPENAI_MODEL_ID : OPENAI_MODEL_OPTIONS[0].id;
  return getOpenAiModelOption(modelId);
}
