import { useState } from 'react';
import { convertToRiskGuideMd } from '../utils/riskGuideAiHelper';

/**
 * Risk Guide 전용 AI 본문 생성 훅
 * 평문 텍스트 → 요약(summaryTitle/summaryText) + 본문 MD(mdSource) 변환 후 반영
 */
export default function useRiskGuideAi({ setData }) {
  const [plainText, setPlainText] = useState('');
  const [isRiskAiGenerating, setIsRiskAiGenerating] = useState(false);
  const [riskAiError, setRiskAiError] = useState('');

  const handleRiskGuideGenerateAI = async () => {
    if (!plainText.trim()) {
      setRiskAiError('변환할 원문 내용을 입력해 주세요.');
      return;
    }

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey || apiKey === '여기에_OpenAI_API_키_입력') {
      setRiskAiError('.env 파일에 올바른 VITE_OPENAI_API_KEY를 설정해주세요.');
      return;
    }

    setRiskAiError('');
    setIsRiskAiGenerating(true);

    try {
      const { summaryTitle, summaryText, mdSource } = await convertToRiskGuideMd(
        plainText.trim(),
        apiKey
      );
      setData((prev) => ({
        ...prev,
        summaryTitle,
        summaryText,
        mdSource,
      }));
    } catch (err) {
      setRiskAiError(err?.message || 'AI 변환 중 오류가 발생했습니다.');
    } finally {
      setIsRiskAiGenerating(false);
    }
  };

  return {
    plainText,
    setPlainText,
    isRiskAiGenerating,
    riskAiError,
    handleRiskGuideGenerateAI,
  };
}
