import { useState } from 'react';
import { generateReportFromFile } from '../utils/aiHelper';
import { toHtml } from '../utils/markdown';

function clearFileInput(fileInputRef) {
  if (fileInputRef.current) fileInputRef.current.value = '';
}

export default function useAiAttachment({ data, setData, fileInputRef }) {
  const [attachedFile, setAttachedFile] = useState(null);
  const [aiError, setAiError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAttachedFile(file);
    setData((prev) => ({ ...prev, attachedFileName: file.name }));

    if (/\.(md|markdown)$/i.test(file.name)) {
      const text = await file.text();
      const html = toHtml(text);
      setData((prev) => ({ ...prev, body: html }));
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    setData((prev) => ({ ...prev, attachedFileName: '' }));
    clearFileInput(fileInputRef);
  };

  const resetAttachment = () => {
    setAttachedFile(null);
    clearFileInput(fileInputRef);
  };

  const handleGenerateAI = async () => {
    if (!attachedFile) {
      setAiError('참고 파일을 먼저 첨부해주세요.');
      return;
    }
    const envApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!envApiKey || envApiKey === '여기에_OpenAI_API_키_입력') {
      setAiError('.env 파일에 올바른 VITE_OPENAI_API_KEY를 설정해주세요.');
      return;
    }
    setAiError('');
    setIsGenerating(true);
    try {
      const content = await attachedFile.text();
      const generated = await generateReportFromFile(
        content,
        attachedFile.name,
        data.title,
        data.recipient,
        envApiKey
      );
      const html = toHtml(generated);
      setData((prev) => ({ ...prev, body: html }));
    } catch (err) {
      setAiError(err?.message || 'AI 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    attachedFile,
    setAttachedFile,
    aiError,
    isGenerating,
    handleFileChange,
    handleRemoveFile,
    resetAttachment,
    handleGenerateAI,
  };
}
