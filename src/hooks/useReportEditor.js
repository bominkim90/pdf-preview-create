import { useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { deleteDocument } from '../api/documents';
import { createInitialFormData, mergeLoadedFormData } from '../constants/documentSchema';
import { isRiskGuideTemplate } from '../templates/registry';
import {
  createRiskGuideBlank,
  createRiskGuideExample,
  createRiskGuideFormData,
} from '../templates/risk-guide/defaults';
import { isMaster, signOut } from '../lib/auth';
import { computeEditorPermissions } from '../utils/documentPermissions';
import { exportReportPdfAndSave, notifyExportResult } from '../utils/reportExport';
import { useAuth } from '../contexts/AuthContext';
import useAiAttachment from './useAiAttachment';
import useBodyChunks from './useBodyChunks';
import useDocumentLoader from './useDocumentLoader';
import useFormFieldSetter from './useFormFieldSetter';
import useMobileEditorView from './useMobileEditorView';

export default function useReportEditor() {
  const { id: routeDocumentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();

  const [data, setData] = useState(() => createInitialFormData());
  const [documentId, setDocumentId] = useState(null);
  const [loadedAuthorId, setLoadedAuthorId] = useState(undefined);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef(null);
  const measureRef = useRef(null);

  const { isMobile, mobileView, setMobileView, previewScrollRef, previewActive } =
    useMobileEditorView();

  const { isGuestMode, isReadOnlyView, canSaveToDb } = computeEditorPermissions({
    routeDocumentId,
    loadedAuthorId,
    user,
    userIsMaster: isMaster(profile),
    pathname: location.pathname,
  });

  const isRiskGuide = isRiskGuideTemplate(data.templateId);

  const {
    attachedFile,
    setAttachedFile,
    aiError,
    isGenerating,
    handleFileChange,
    handleRemoveFile,
    resetAttachment,
    handleGenerateAI,
  } = useAiAttachment({ data, setData, fileInputRef });

  useDocumentLoader({
    routeDocumentId,
    location,
    navigate,
    fileInputRef,
    setData,
    setDocumentId,
    setLoadedAuthorId,
    setLoadError,
    setIsLoadingDoc,
    setAttachedFile,
  });

  const bodyChunks = useBodyChunks(data.body, measureRef);
  const set = useFormFieldSetter(setData);

  const handleCopyAsNewDocument = () => {
    navigate('/new', {
      state: { importFormData: mergeLoadedFormData(data) },
    });
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err?.message || '로그아웃에 실패했습니다.');
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const result = await exportReportPdfAndSave({
        data,
        documentId,
        canSaveToDb,
        navigate,
      });
      if (result.savedDocumentId !== documentId) {
        setDocumentId(result.savedDocumentId);
      }
      notifyExportResult({ ...result, isReadOnlyView, isGuestMode });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!documentId || isReadOnlyView) return;

    const label = data.title?.trim() || '제목 없음';
    if (!window.confirm(`「${label}」 문서를 삭제할까요?\n삭제 후에는 되돌릴 수 없습니다.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteDocument(documentId);
      navigate('/documents');
    } catch (err) {
      toast.error(err?.message || '문서 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTemplateChange = (e) => {
    const nextId = e.target.value;
    if (nextId === data.templateId) return;

    if (!window.confirm('템플릿을 변경하면 작성 중인 내용이 초기화됩니다. 계속할까요?')) {
      e.target.value = data.templateId;
      return;
    }

    setDocumentId(null);
    resetAttachment();
    if (routeDocumentId) navigate('/new', { replace: true });

    setData(isRiskGuideTemplate(nextId) ? createRiskGuideFormData() : createInitialFormData());
  };

  const handleLoadRiskExample = () => {
    if (!window.confirm('예시 내용으로 덮어씁니다. 계속할까요?')) return;
    setData(createRiskGuideExample());
  };

  const handleClearRiskContent = () => {
    if (!window.confirm('제목·작성자·본문을 비웁니다. 계속할까요?')) return;
    setData(createRiskGuideBlank());
  };

  return {
    profile,
    data,
    setData,
    documentId,
    isLoadingDoc,
    loadError,
    isGuestMode,
    isReadOnlyView,
    isRiskGuide,
    isExporting,
    isDeleting,
    isMobile,
    mobileView,
    setMobileView,
    previewScrollRef,
    previewActive,
    measureRef,
    fileInputRef,
    bodyChunks,
    attachedFile,
    aiError,
    isGenerating,
    set,
    handleCopyAsNewDocument,
    handleLogout,
    handleExportPDF,
    handleDeleteDocument,
    handleTemplateChange,
    handleLoadRiskExample,
    handleClearRiskContent,
    handleFileChange,
    handleRemoveFile,
    handleGenerateAI,
  };
}
