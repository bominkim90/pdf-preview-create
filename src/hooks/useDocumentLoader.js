import { useEffect } from 'react';
import { getDocumentById } from '../api/documents';
import { createInitialFormData, mergeLoadedFormData } from '../constants/documentSchema';
import { isSupabaseConfigured } from '../lib/supabase';

function clearFileInput(fileInputRef) {
  if (fileInputRef.current) fileInputRef.current.value = '';
}

export default function useDocumentLoader({
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
}) {
  useEffect(() => {
    if (!routeDocumentId) {
      const imported = location.state?.importFormData;
      if (imported) {
        setData(mergeLoadedFormData(imported));
        setDocumentId(null);
        setLoadedAuthorId(undefined);
        setLoadError('');
        setAttachedFile(null);
        clearFileInput(fileInputRef);
        navigate(location.pathname, { replace: true, state: {} });
        return;
      }

      setData(createInitialFormData());
      setDocumentId(null);
      setLoadedAuthorId(undefined);
      setLoadError('');
      setAttachedFile(null);
      clearFileInput(fileInputRef);
      return;
    }

    if (!isSupabaseConfigured()) {
      setLoadError('.env에 Supabase 설정이 필요합니다.');
      return;
    }

    let cancelled = false;
    setIsLoadingDoc(true);
    setLoadError('');
    setLoadedAuthorId(undefined);

    getDocumentById(routeDocumentId)
      .then((doc) => {
        if (cancelled) return;
        setData(mergeLoadedFormData(doc.form_data));
        setDocumentId(doc.id);
        setLoadedAuthorId(doc.author_id ?? null);
        setAttachedFile(null);
        clearFileInput(fileInputRef);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err?.message || '문서를 불러오지 못했습니다.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDoc(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    routeDocumentId,
    location.state,
    location.pathname,
    navigate,
    fileInputRef,
    setData,
    setDocumentId,
    setLoadedAuthorId,
    setLoadError,
    setIsLoadingDoc,
    setAttachedFile,
  ]);
}
