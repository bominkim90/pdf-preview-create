import RichEditor from '../RichEditor';
import { CLOSING_PAGE_STYLE_OPTIONS } from '../../constants/documentSchema';
import {
  CLASSIFICATION_OPTIONS,
  RETENTION_OPTIONS,
} from '../../constants/editorFormOptions';
import { TEMPLATE_OPTIONS } from '../../templates/registry';
import { RISK_GUIDE_MD_GUIDE } from '../../templates/risk-guide/guide';
import AiReportSection from './AiReportSection';

export default function EditorFormPanel({
  data,
  setData,
  set,
  isReadOnlyView,
  isRiskGuide,
  compileErrors = [],
  isMobile,
  mobileView,
  setMobileView,
  attachedFile,
  fileInputRef,
  aiError,
  isGenerating,
  onFileChange,
  onRemoveFile,
  onGenerateAI,
  onTemplateChange,
  plainText,
  setPlainText,
  isRiskAiGenerating,
  riskAiError,
  onRiskGuideGenerateAI,
}) {
  return (
    <aside
      className={`form-panel ${isMobile && mobileView === 'preview' ? 'mobile-hidden' : ''}`}
    >
      <fieldset className="form-fieldset" disabled={isReadOnlyView}>
        <div className="form-scroll">
          <section className="form-section">
            <h3 className="section-title">
              <span className="section-icon">📄</span> 템플릿
            </h3>
            <div className="field">
              <label>문서 양식</label>
              <select
                className="input template-select"
                value={data.templateId}
                onChange={onTemplateChange}
              >
                {TEMPLATE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {isRiskGuide && (
            <section className="form-section risk-ai-section">
              <h3 className="section-title">
                <span className="section-icon">✨</span> AI로 본문 생성
              </h3>
              <p className="field-hint">
                원문 텍스트를 붙여넣으면 AI가 커스텀 MD 형식으로 변환하여 아래 본문 MD에 자동
                입력합니다. 아래 문서 헤더에서 제목·작성자·작성일을 먼저 입력해야 합니다.
              </p>
              <div className="field">
                <label>원문 내용</label>
                <textarea
                  value={plainText ?? ''}
                  onChange={(e) => setPlainText(e.target.value)}
                  rows={10}
                  className="input textarea"
                  placeholder="변환할 원문 내용을 붙여넣으세요..."
                  spellCheck={false}
                  disabled={isRiskAiGenerating}
                />
              </div>
              {riskAiError && <p className="ai-error-msg">{riskAiError}</p>}
              <button
                type="button"
                className={`btn-risk-ai-generate ${isRiskAiGenerating ? 'loading' : ''}`}
                onClick={onRiskGuideGenerateAI}
                disabled={isRiskAiGenerating}
              >
                {isRiskAiGenerating ? (
                  <>
                    <span className="btn-spinner" aria-hidden="true" />
                    변환 중...
                  </>
                ) : (
                  <>
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                    </svg>
                    AI로 본문 생성
                  </>
                )}
              </button>
            </section>
          )}

          {isRiskGuide && (
            <>
              <section className="form-section">
                <h3 className="section-title">
                  <span className="section-icon">📋</span> 문서 헤더
                </h3>
                <p className="field-hint">
                  제목·요약 박스·작성자 정보는 여기서 직접 편집합니다. 아래 MD는 본문만 담습니다.
                </p>
                <div className="field">
                  <label>문서 제목</label>
                  <input
                    type="text"
                    value={data.title ?? ''}
                    onChange={set('title')}
                    placeholder="예: 업무 리스크 관리"
                    className="input input-lg"
                  />
                </div>
                <div className="field-grid-2">
                  <div className="field">
                    <label>작성자</label>
                    <input
                      type="text"
                      value={data.author ?? ''}
                      onChange={set('author')}
                      placeholder="예: 홍길동 과장"
                      className="input"
                    />
                  </div>
                  <div className="field">
                    <label>작성일</label>
                    <input
                      type="text"
                      value={data.date ?? ''}
                      onChange={set('date')}
                      placeholder="예: 2026-06-26"
                      className="input"
                    />
                  </div>
                </div>
                <div className="field">
                  <label>요약 제목</label>
                  <input
                    type="text"
                    value={data.summaryTitle ?? ''}
                    onChange={set('summaryTitle')}
                    placeholder="예: 업무 리스크란?"
                    className="input"
                  />
                </div>
                <div className="field">
                  <label>요약 본문</label>
                  <textarea
                    value={data.summaryText ?? ''}
                    onChange={set('summaryText')}
                    rows={5}
                    className="input textarea"
                    placeholder="빈 줄로 문단을 구분합니다. «강조» 마킹을 쓸 수 있습니다."
                    spellCheck={false}
                  />
                </div>
              </section>

              <section className="form-section">
                <h3 className="section-title">
                  <span className="section-icon">📝</span> 본문 MD
                </h3>
                <p className="field-hint">
                  섹션·표·목록 등 본문 내용을 MD로 입력합니다. 헤더(제목·요약)는 위 입력란을
                  사용하세요.
                </p>
                <details className="md-guide-details">
                  <summary>MD 문법 가이드</summary>
                  <pre className="md-guide-pre">{RISK_GUIDE_MD_GUIDE}</pre>
                </details>
                {compileErrors.length > 0 && (
                  <div className="compile-errors">
                    {compileErrors.map((error) => (
                      <p key={error}>{error}</p>
                    ))}
                  </div>
                )}
                <div className="field">
                  <label>본문 MD</label>
                  <textarea
                    value={data.mdSource ?? ''}
                    onChange={(e) => setData((prev) => ({ ...prev, mdSource: e.target.value }))}
                    rows={18}
                    className="input textarea md-source-textarea"
                    placeholder="예시 불러오기로 샘플 본문을 확인할 수 있습니다."
                    spellCheck={false}
                  />
                </div>
              </section>
            </>
          )}

          {!isRiskGuide && (
            <>
              <section className="form-section">
                <h3 className="section-title">
                  <span className="section-icon">📋</span> 기본 정보
                </h3>
                <div className="field-grid-2">
                  <div className="field">
                    <label>
                      기관/회사명 <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      value={data.orgName}
                      onChange={set('orgName')}
                      placeholder="예: ○○부, ○○팀"
                      className="input"
                    />
                  </div>
                  <div className="field">
                    <label>작성부서</label>
                    <input
                      type="text"
                      value={data.department}
                      onChange={set('department')}
                      placeholder="예: 경영지원팀"
                      className="input"
                    />
                  </div>
                </div>
                <div className="field-grid-2">
                  <div className="field">
                    <label>문서번호</label>
                    <input
                      type="text"
                      value={data.docNumber}
                      onChange={set('docNumber')}
                      placeholder="예: 경영-2024-001"
                      className="input"
                    />
                  </div>
                  <div className="field">
                    <label>작성일</label>
                    <input type="text" value={data.date} onChange={set('date')} className="input" />
                  </div>
                </div>
                <div className="field">
                  <label>문서분류</label>
                  <div className="radio-group">
                    {CLASSIFICATION_OPTIONS.map((opt) => (
                      <label key={opt} className="radio-label">
                        <input
                          type="radio"
                          name="classification"
                          value={opt}
                          checked={data.classification === opt}
                          onChange={() => setData((prev) => ({ ...prev, classification: opt }))}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </section>

              <section className="form-section">
                <h3 className="section-title">
                  <span className="section-icon">📨</span> 수신 / 발신
                </h3>
                <div className="field">
                  <label>
                    수신 <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={data.recipient}
                    onChange={set('recipient')}
                    placeholder="예: 대표이사, 부서장"
                    className="input"
                  />
                </div>
                <div className="field">
                  <label>경유</label>
                  <input
                    type="text"
                    value={data.via}
                    onChange={set('via')}
                    placeholder="경유 기관 (선택)"
                    className="input"
                  />
                </div>
                <div className="field">
                  <label>발신</label>
                  <input
                    type="text"
                    value={data.sender}
                    onChange={set('sender')}
                    placeholder="예: 경영지원팀장"
                    className="input"
                  />
                </div>
              </section>

              <section className="form-section">
                <div className="section-title-row">
                  <h3 className="section-title" style={{ margin: 0 }}>
                    <span className="section-icon">✅</span> 결재 정보
                  </h3>
                  <label className="toggle-switch-label">
                    <span className="toggle-switch-text">문서에 표시</span>
                    <button
                      type="button"
                      className={`toggle-switch ${data.showApproval ? 'on' : ''}`}
                      onClick={() =>
                        setData((prev) => ({ ...prev, showApproval: !prev.showApproval }))
                      }
                      aria-checked={data.showApproval}
                      role="switch"
                    >
                      <span className="toggle-thumb" />
                    </button>
                  </label>
                </div>
                <div className={`toggleable-fields ${data.showApproval ? '' : 'dimmed'}`}>
                  <div className="field-grid-3" style={{ marginTop: 12 }}>
                    <div className="field">
                      <label>기안자</label>
                      <input
                        type="text"
                        value={data.author}
                        onChange={set('author')}
                        placeholder="이름"
                        className="input"
                        disabled={!data.showApproval}
                      />
                    </div>
                    <div className="field">
                      <label>검토자</label>
                      <input
                        type="text"
                        value={data.reviewer}
                        onChange={set('reviewer')}
                        placeholder="이름"
                        className="input"
                        disabled={!data.showApproval}
                      />
                    </div>
                    <div className="field">
                      <label>결재자</label>
                      <input
                        type="text"
                        value={data.approver}
                        onChange={set('approver')}
                        placeholder="이름"
                        className="input"
                        disabled={!data.showApproval}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="form-section">
                <div className="section-title-row">
                  <h3 className="section-title" style={{ margin: 0 }}>
                    <span className="section-icon">🔴</span> 직인
                  </h3>
                  <label className="toggle-switch-label">
                    <span className="toggle-switch-text">문서에 표시</span>
                    <button
                      type="button"
                      className={`toggle-switch ${data.showSeal ? 'on' : ''}`}
                      onClick={() => setData((prev) => ({ ...prev, showSeal: !prev.showSeal }))}
                      aria-checked={data.showSeal}
                      role="switch"
                    >
                      <span className="toggle-thumb" />
                    </button>
                  </label>
                </div>
                <p className="section-desc" style={{ marginTop: 8, marginBottom: 0 }}>
                  표지 및 끝장의 직인 영역을 출력에 포함합니다.
                </p>
              </section>

              <section className="form-section">
                <h3 className="section-title">
                  <span className="section-icon">📄</span> 끝장 레이아웃
                </h3>
                <p className="section-desc" style={{ marginTop: 0, marginBottom: 12 }}>
                  공문 정보(보존기간·발신명의·직인·결재)와 재산 문구가 들어가는 마지막 페이지
                  형식입니다.
                </p>
                <div className="closing-style-options">
                  {CLOSING_PAGE_STYLE_OPTIONS.map(({ value, label }) => (
                    <label key={value} className="closing-style-option">
                      <input
                        type="radio"
                        name="closingPageStyle"
                        value={value}
                        checked={data.closingPageStyle === value}
                        onChange={() => setData((prev) => ({ ...prev, closingPageStyle: value }))}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </section>
            </>
          )}

          {!isRiskGuide && (
            <section className="form-section">
              <h3 className="section-title">
                <span className="section-icon">📝</span> 문서 내용
              </h3>
              <div className="field">
                <label>
                  제목 <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={data.title}
                  onChange={set('title')}
                  placeholder="보고서 제목을 입력하세요"
                  className="input input-lg"
                />
              </div>
              <div className="field">
                <label>
                  본문 <span className="required">*</span>
                </label>
                <RichEditor
                  value={data.body}
                  onChange={(html) => setData((prev) => ({ ...prev, body: html }))}
                  readOnly={isReadOnlyView}
                  placeholder="본문을 직접 입력하거나, 파일을 첨부하여 AI로 생성하세요."
                />
              </div>
            </section>
          )}

          {!isRiskGuide && (
            <>
              <section className="form-section">
                <h3 className="section-title">
                  <span className="section-icon">🗂️</span> 보존기간
                </h3>
                <div className="retention-group">
                  {RETENTION_OPTIONS.map((opt) => (
                    <label
                      key={opt}
                      className={`retention-chip ${data.retention === opt ? 'active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="retention"
                        value={opt}
                        checked={data.retention === opt}
                        onChange={() => setData((prev) => ({ ...prev, retention: opt }))}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </section>

              <AiReportSection
                attachedFile={attachedFile}
                fileInputRef={fileInputRef}
                aiError={aiError}
                isGenerating={isGenerating}
                onFileChange={onFileChange}
                onRemoveFile={onRemoveFile}
                onGenerateAI={onGenerateAI}
              />
            </>
          )}
        </div>
      </fieldset>

      {isMobile && (
        <div className="mobile-preview-sticky">
          <button
            type="button"
            className="btn-preview-mobile"
            onClick={() => setMobileView('preview')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            미리보기
          </button>
        </div>
      )}
    </aside>
  );
}
