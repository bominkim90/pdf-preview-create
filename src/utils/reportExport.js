import { toast } from 'sonner';
import { saveDocument } from '../api/documents';
import { isSupabaseConfigured } from '../lib/supabase';
import { exportToPDF } from './pdfExport';

export async function exportReportPdfAndSave({
  data,
  documentId,
  canSaveToDb,
  navigate,
}) {
  let pdfOk = false;
  let pdfError = null;
  let dbOk = false;
  let dbError = null;
  let dbMessage = '';
  let savedDocumentId = documentId;

  try {
    const filename = `${data.title || '보고서'}_${data.date}.pdf`;
    await exportToPDF('document-preview', filename);
    pdfOk = true;
  } catch (err) {
    pdfError = err?.message || 'PDF 생성 중 오류가 발생했습니다.';
  }

  if (canSaveToDb) {
    try {
      const result = await saveDocument({ documentId, formData: data });
      savedDocumentId = result.id;
      if (result.isNew) {
        navigate(`/edit/${result.id}`, { replace: true });
      }
      dbOk = true;
      dbMessage = result.isNew ? '문서가 새로 저장되었습니다.' : '문서가 수정 저장되었습니다.';
    } catch (err) {
      dbError = err?.message || '문서 저장 중 오류가 발생했습니다.';
    }
  }

  return { pdfOk, pdfError, dbOk, dbError, dbMessage, savedDocumentId };
}

export function notifyExportResult({
  pdfOk,
  pdfError,
  dbOk,
  dbError,
  dbMessage,
  isReadOnlyView,
  isGuestMode,
}) {
  if (pdfOk && dbOk) {
    toast.success(`PDF 저장 및 ${dbMessage}`);
  } else if (pdfOk && dbError) {
    toast.warning(`PDF는 저장되었으나 DB 저장 실패: ${dbError}`);
  } else if (!pdfOk && dbOk) {
    toast.warning(`PDF 저장 실패. 문서만 DB에 저장됨: ${dbMessage}`);
  } else if (!pdfOk && dbError) {
    toast.error(`PDF: ${pdfError} / DB: ${dbError}`);
  } else if (pdfOk && isReadOnlyView) {
    toast.warning('PDF만 저장되었습니다. (다른 사용자 문서는 DB에 저장할 수 없습니다)');
  } else if (pdfOk && isGuestMode) {
    toast.success('PDF만 저장되었습니다. (DB에는 저장되지 않습니다)');
  } else if (pdfOk && !isSupabaseConfigured()) {
    toast.warning('PDF는 저장되었으나 Supabase가 설정되지 않아 문서는 DB에 저장되지 않았습니다.');
  } else if (pdfError) {
    toast.error(pdfError);
  }
}
