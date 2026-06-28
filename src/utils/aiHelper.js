import OpenAI from 'openai';
import { getActiveOpenAiModel } from '../constants/openAiModels';

export { OPENAI_MODEL_OPTIONS, getActiveOpenAiModel } from '../constants/openAiModels';

export async function generateReportFromFile(fileContent, fileName, title, recipient, apiKey) {
  const client = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const { id: modelId } = getActiveOpenAiModel();

  const prompt = `다음은 보고서 작성에 사용할 원본 자료입니다. 아래 규칙을 엄격히 준수하여 "${title || '보고서'}" 제목의 공식 보고서 본문을 작성해 주세요.

  참고 자료 파일명: ${fileName}
  ---
  ${fileContent}
  ---

  [필수 준수 규칙]
  1. 원본 자료의 모든 내용을 빠짐없이 포함해야 합니다. 내용을 임의로 생략하거나 요약으로 대체하면 안 됩니다.
  2. 원본에 표(table)가 있는 경우 해당 표를 그대로 보고서 본문에 삽입합니다. (마크다운 표 형식 사용)
  3. 원본에 목록, 수치, 날짜, 고유명사가 있으면 정확히 그대로 옮깁니다.
  4. 원본 내용을 모두 담은 뒤, 내용을 보완하는 추론·분석·기대효과를 추가할 수 있습니다.
  5. 수신자: ${recipient || '상위 기관'} — 경어체(합니다/입니다) 사용
  6. 항목 구분: 1., 2., 3. / 가., 나., 다. / 1), 2), 3) 순서로 계층 구성
  7. 불필요한 서론 없이 바로 본문 내용 시작
  8. 마지막에 "끝." 으로 마무리`;

  const response = await client.chat.completions.create({
    model: modelId,
    messages: [
      {
        role: 'system',
        content:
          '당신은 한국 행정 공문서 작성 전문가입니다. 원본 자료의 내용을 단 하나도 누락하지 않고 보고서에 전부 반영하는 것이 최우선 원칙입니다. 표, 수치, 목록 등 구조화된 데이터는 원형 그대로 유지합니다.',
      },
      { role: 'user', content: prompt },
    ],
    max_tokens: 4096,
    temperature: 0.2,
  });

  return response.choices[0].message.content;
}
