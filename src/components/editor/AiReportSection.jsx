export default function AiReportSection({
  attachedFile,
  fileInputRef,
  aiError,
  isGenerating,
  onFileChange,
  onRemoveFile,
  onGenerateAI,
}) {
  return (
    <section className="form-section ai-attach-section">
      <h3 className="section-title">
        <span className="section-icon">🤖</span> AI 보고서 생성
      </h3>
      <p className="section-desc">
        .txt, .md 파일을 첨부하면 GPT-4o-mini가 내용을 분석하여 본문을 자동 작성합니다.
      </p>

      {!attachedFile ? (
        <label className="file-drop-zone">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.text"
            onChange={onFileChange}
            style={{ display: 'none' }}
          />
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="upload-icon">
            <path
              d="M12 3v13M7 11l5-5 5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path d="M4 20h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>클릭하여 파일 선택</span>
          <span className="file-hint">.txt, .md 파일 지원</span>
        </label>
      ) : (
        <div className="file-attached">
          <div className="file-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path d="M13 2v7h7" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span className="file-name">{attachedFile.name}</span>
            <span className="file-size">({(attachedFile.size / 1024).toFixed(1)} KB)</span>
          </div>
          <button type="button" className="btn-remove-file" onClick={onRemoveFile}>
            ✕
          </button>
        </div>
      )}

      {aiError && <div className="ai-error">{aiError}</div>}

      <button
        type="button"
        className="btn-ai"
        onClick={onGenerateAI}
        disabled={isGenerating || !attachedFile}
      >
        {isGenerating ? (
          <>
            <span className="btn-spinner" />
            AI 작성 중...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            AI로 본문 생성
          </>
        )}
      </button>
    </section>
  );
}
