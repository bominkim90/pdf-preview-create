import DocumentPreview from '../DocumentPreview';
import ScaledPreview, { DEFAULT_SCALE } from '../ScaledPreview';

export default function EditorPreviewPanel({
  isMobile,
  mobileView,
  setMobileView,
  previewScrollRef,
  previewActive,
  isExporting,
  onExportPDF,
  templateId,
  data,
  bodyChunks,
}) {
  return (
    <main
      className={`preview-panel ${isMobile && mobileView === 'preview' ? 'mobile-fullscreen' : ''} ${isMobile && mobileView === 'form' ? 'mobile-collapsed' : ''}`}
    >
      <div className="preview-toolbar">
        {isMobile && (
          <button type="button" className="btn-back-mobile" onClick={() => setMobileView('form')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            뒤로
          </button>
        )}
        <span className="preview-label">미리보기 (A4)</span>
        <span className="preview-hint">PDF 출력 결과와 동일합니다</span>
        {isMobile && (
          <button
            type="button"
            className="btn-export btn-export-mobile"
            onClick={onExportPDF}
            disabled={isExporting}
          >
            {isExporting ? (
              <span className="btn-spinner btn-spinner-dark" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 3v13M7 11l5 5 5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M4 20h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
            {isExporting ? '저장 중...' : 'PDF 저장'}
          </button>
        )}
      </div>
      <div className="preview-scroll" ref={previewScrollRef}>
        <ScaledPreview active={previewActive} maxScale={isMobile ? 1 : DEFAULT_SCALE}>
          <DocumentPreview
            templateId={templateId}
            data={data}
            bodyChunks={bodyChunks}
            id="document-preview"
          />
        </ScaledPreview>
      </div>
    </main>
  );
}
