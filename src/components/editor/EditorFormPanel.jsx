import RichEditor from '../RichEditor';
import { CLOSING_PAGE_STYLE_OPTIONS } from '../../constants/documentSchema';
import {
  CLASSIFICATION_OPTIONS,
  RETENTION_OPTIONS,
} from '../../constants/editorFormOptions';
import { TEMPLATE_OPTIONS } from '../../templates/registry';
import AiReportSection from './AiReportSection';

export default function EditorFormPanel({
  data,
  setData,
  set,
  isReadOnlyView,
  isRiskGuide,
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
            <section className="form-section">
              <h3 className="section-title">
                <span className="section-icon">📋</span> 기본 정보
              </h3>
              <div className="field">
                <label>
                  제목 <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={data.title}
                  onChange={set('title')}
                  placeholder="업무 리스크 관리"
                  className="input input-lg"
                />
              </div>
              <div className="field-grid-2">
                <div className="field">
                  <label>작성자</label>
                  <input
                    type="text"
                    value={data.author}
                    onChange={set('author')}
                    placeholder="이름 / 부서"
                    className="input"
                  />
                </div>
                <div className="field">
                  <label>작성일</label>
                  <input type="text" value={data.date} onChange={set('date')} className="input" />
                </div>
              </div>
            </section>
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

          <section className="form-section">
            <h3 className="section-title">
              <span className="section-icon">📝</span> 문서 내용
            </h3>
            {!isRiskGuide && (
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
            )}
            <div className="field">
              <label>
                본문 <span className="required">*</span>
              </label>
              <RichEditor
                value={data.body}
                onChange={(html) => setData((prev) => ({ ...prev, body: html }))}
                readOnly={isReadOnlyView}
                placeholder={
                  isRiskGuide
                    ? '본문을 입력하세요. 표·목록·형광펜 등을 사용할 수 있습니다.'
                    : '본문을 직접 입력하거나, 파일을 첨부하여 AI로 생성하세요.'
                }
              />
            </div>
          </section>

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
