import { useState, useRef, useCallback, useEffect } from 'react'
import { marked } from 'marked'
import DocumentPages from './components/DocumentPages'
import RichEditor from './components/RichEditor'
import { generateReportFromFile } from './utils/aiHelper'
import { exportToPDF } from './utils/pdfExport'
import './App.css'

marked.setOptions({ breaks: true, gfm: true })

const A4_WIDTH = 794
const DEFAULT_SCALE = 0.72
const MOBILE_BREAKPOINT = 768

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  )

  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = (e) => setMatches(e.matches)
    mq.addEventListener('change', handler)
    setMatches(mq.matches)
    return () => mq.removeEventListener('change', handler)
  }, [query])

  return matches
}

// ── 페이지 분할 상수 (document CSS px, 트랜스폼 미적용 기준) ──────────
// A4 1123px, padding 상 106 / 하 57 → inner 960px
// 헤더블록(수신·발신·제목 등) ≈ 230px  /  푸터블록(발신명의·보존기간) ≈ 170px
const BODY_SINGLE_H    = 600   // 단일 페이지: header + body + footer 전부 들어가는 한계
const BODY_FIRST_H     = 750   // 다중 첫 페이지 (마지막 페이지가 될 경우)
const BODY_FIRST_H_MID = 790   // 다중 첫 페이지 (중간 페이지가 될 경우, 여백 채움)
const BODY_CONT_H       = 820   // 이후 페이지 (마지막 페이지가 될 경우)
const BODY_CONT_H_MID   = 890   // 이후 페이지 (중간 페이지가 될 경우, 여백 채움)

// 본문 HTML → 페이지별 청크 배열 계산 (트랜스폼 없는 위치에서 측정)
function useBodyChunks(body, measureRef) {
  const [chunks, setChunks] = useState([''])

  useEffect(() => {
    const container = measureRef.current
    if (!container) return

    let timerId = null

    const run = () => {
      const children = [...container.children]
      if (!children.length) { setChunks([body || '']); return }

      // offsetHeight: 트랜스폼 영향 없는 레이아웃 픽셀
      let totalH = 0
      for (const c of children) totalH += c.offsetHeight

      if (totalH <= BODY_SINGLE_H) { setChunks([body || '']); return }

      const getAttributesString = (el) => {
        const attrs = []
        for (const attr of el.attributes) {
          attrs.push(`${attr.name}="${attr.value.replace(/"/g, '&quot;')}"`)
        }
        return attrs.length ? ' ' + attrs.join(' ') : ''
      }

      const getTempHeight = (html) => {
        const temp = document.createElement('div')
        temp.className = 'doc-body-content'
        temp.style.width = '661px'
        temp.innerHTML = html
        container.parentNode.appendChild(temp)
        const h = temp.offsetHeight
        container.parentNode.removeChild(temp)
        return h
      }

      // 평탄화 (리스트와 테이블 행 단위 분할 지원)
      const flatItems = []
      for (const child of children) {
        if (child.tagName === 'UL' || child.tagName === 'OL') {
          const tag = child.tagName.toLowerCase()
          const attrs = getAttributesString(child)
          const listItems = [...child.children]
          for (const li of listItems) {
            flatItems.push({
              type: 'list-item',
              tagName: tag,
              attributes: attrs,
              html: li.outerHTML,
            })
          }
        } else if (child.tagName === 'TABLE') {
          const attrs = getAttributesString(child)
          const thead = child.querySelector('thead')
          const theadHtml = thead ? thead.outerHTML : ''
          const trs = []
          const allTrs = child.querySelectorAll('tr')
          for (const tr of allTrs) {
            if (!tr.closest('thead')) {
              trs.push(tr)
            }
          }

          if (trs.length > 0) {
            for (const tr of trs) {
              flatItems.push({
                type: 'table-row',
                tagName: 'table',
                attributes: attrs,
                theadHtml: theadHtml,
                html: tr.outerHTML,
              })
            }
          } else {
            flatItems.push({
              type: 'block',
              html: child.outerHTML,
            })
          }
        } else {
          flatItems.push({
            type: 'block',
            html: child.outerHTML,
          })
        }
      }

      const renderItems = (items) => {
        let html = ''
        let currentMode = 'none' // 'none', 'list', 'table'
        let currentTag = ''
        let currentAttrs = ''
        let currentThead = ''

        const closeActiveContainer = () => {
          if (currentMode === 'list') {
            html += `</${currentTag}>`
          } else if (currentMode === 'table') {
            html += `</tbody></${currentTag}>`
          }
          currentMode = 'none'
          currentTag = ''
          currentAttrs = ''
          currentThead = ''
        }

        for (const item of items) {
          if (item.type === 'list-item') {
            if (currentMode !== 'list' || currentTag !== item.tagName || currentAttrs !== item.attributes) {
              closeActiveContainer()
              html += `<${item.tagName}${item.attributes}>`
              currentMode = 'list'
              currentTag = item.tagName
              currentAttrs = item.attributes
            }
            html += item.html
          } else if (item.type === 'table-row') {
            if (currentMode !== 'table' || currentTag !== item.tagName || currentAttrs !== item.attributes || currentThead !== item.theadHtml) {
              closeActiveContainer()
              html += `<${item.tagName}${item.attributes}>`
              if (item.theadHtml) {
                html += item.theadHtml
              }
              html += '<tbody>'
              currentMode = 'table'
              currentTag = item.tagName
              currentAttrs = item.attributes
              currentThead = item.theadHtml
            }
            html += item.html
          } else {
            closeActiveContainer()
            html += item.html
          }
        }
        closeActiveContainer()
        return html
      }

      // 여러 페이지 분할
      const result = []
      let currentPageItems = []
      let isFirst = true

      for (let i = 0; i < flatItems.length; i++) {
        const item = flatItems[i]
        const testItems = [...currentPageItems, item]
        const testHtml = renderItems(testItems)
        const h = getTempHeight(testHtml)

        // 현재 페이지의 한계선 결정 (남은 분량이 충분히 길면 중간 페이지용 넉넉한 한계선 적용)
        let limit = isFirst ? BODY_FIRST_H : BODY_CONT_H
        if (i < flatItems.length - 1) {
          const remainingItems = flatItems.slice(i + 1)
          const remainingHtml = renderItems(remainingItems)
          const remainingH = getTempHeight(remainingHtml)
          
          // 남은 요소가 있고, 그 높이가 유의미하다면 중간 페이지 한계선으로 상향 적용
          if (remainingH > 80) {
            limit = isFirst ? BODY_FIRST_H_MID : BODY_CONT_H_MID
          }
        }

        if (h > limit && currentPageItems.length > 0) {
          result.push(renderItems(currentPageItems))
          currentPageItems = [item]
          isFirst = false
        } else {
          currentPageItems.push(item)
        }
      }

      if (currentPageItems.length > 0) {
        result.push(renderItems(currentPageItems))
      }

      setChunks(result.length ? result : [body || ''])
    }

    const debouncedRun = () => {
      if (timerId) clearTimeout(timerId)
      timerId = setTimeout(() => {
        document.fonts.ready.then(() => requestAnimationFrame(run))
      }, 100) // 100ms 디바운스로 반응 속도 극대화
    }

    debouncedRun()

    return () => {
      if (timerId) clearTimeout(timerId)
    }
  }, [body, measureRef])

  return chunks
}

// transform: scale()은 레이아웃 흐름에서 크기가 사라지므로
// wrapper는 absolute로 flow에서 분리하고, outer에 scaled 크기를 부여
function ScaledPreview({ children, maxScale = DEFAULT_SCALE, active = true }) {
  const wrapperRef = useRef(null)
  const outerRef = useRef(null)
  const [scale, setScale] = useState(maxScale)

  const updateScale = useCallback(() => {
    const scrollParent = outerRef.current?.parentElement
    if (!scrollParent) return
    const available = scrollParent.clientWidth - 32
    if (available <= 0) return
    const computed = Math.min(maxScale, available / A4_WIDTH)
    setScale(Math.max(0.35, computed))
  }, [maxScale])

  useEffect(() => {
    if (!active) return
    const scrollParent = outerRef.current?.parentElement
    if (!scrollParent) return

    updateScale()
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(updateScale)
    })

    const observer = new ResizeObserver(updateScale)
    observer.observe(scrollParent)
    return () => {
      cancelAnimationFrame(rafId)
      observer.disconnect()
    }
  }, [maxScale, active, updateScale])

  useEffect(() => {
    if (!active || !wrapperRef.current || !outerRef.current) return

    const updateHeight = () => {
      const h = wrapperRef.current.offsetHeight
      outerRef.current.style.height = `${h * scale}px`
      outerRef.current.style.width = `${A4_WIDTH * scale}px`
    }

    updateHeight()
    const observer = new ResizeObserver(updateHeight)
    observer.observe(wrapperRef.current)
    return () => observer.disconnect()
  }, [scale, children, active])

  useEffect(() => {
    if (!active) return
    outerRef.current?.parentElement?.scrollTo(0, 0)
  }, [scale, active])

  return (
    <div
      ref={outerRef}
      className="preview-scale-outer"
      style={{ width: `${A4_WIDTH * scale}px` }}
    >
      <div
        ref={wrapperRef}
        className="preview-scale-wrapper"
        style={{ transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  )
}

function toHtml(text) {
  return marked.parse(text)
}

const RETENTION_OPTIONS = ['영구', '준영구', '10년', '5년', '3년', '1년']
const CLASSIFICATION_OPTIONS = ['일반문서', '대외비', '비밀', '기밀']

const today = new Date().toLocaleDateString('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const initialData = {
  orgName: 'iStaging Asia',
  recipient: '',
  via: '',
  sender: '',
  title: '',
  body: '',
  retention: '1년',
  attachedFileName: '',
  author: '',
  reviewer: '',
  approver: '',
  department: '',
  docNumber: '',
  date: today,
  classification: '일반문서',
  showApproval: false,
  showSeal: false,
}

export default function App() {
  const [data, setData] = useState(initialData)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [aiError, setAiError] = useState('')
  const [attachedFile, setAttachedFile] = useState(null)
  const [mobileView, setMobileView] = useState('form')
  const fileInputRef = useRef(null)
  const measureRef = useRef(null)
  const previewScrollRef = useRef(null)
  const isMobile = useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT}px)`)
  const previewActive = !isMobile || mobileView === 'preview'

  useEffect(() => {
    if (!isMobile) setMobileView('form')
  }, [isMobile])

  useEffect(() => {
    if (isMobile && mobileView === 'preview') {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isMobile, mobileView])

  useEffect(() => {
    if (isMobile && mobileView === 'preview' && previewScrollRef.current) {
      requestAnimationFrame(() => {
        previewScrollRef.current?.scrollTo(0, 0)
      })
    }
  }, [isMobile, mobileView])

  // 페이지 분할 청크 계산 (측정 div는 트랜스폼 바깥에 렌더링)
  const bodyChunks = useBodyChunks(data.body, measureRef)

  const set = useCallback((field) => (e) => {
    const val = e.target ? e.target.value : e
    setData((prev) => ({ ...prev, [field]: val }))
  }, [])

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAttachedFile(file)
    setData((prev) => ({ ...prev, attachedFileName: file.name }))

    // .md 파일이면 즉시 파싱해서 에디터에 표시
    if (/\.(md|markdown)$/i.test(file.name)) {
      const text = await file.text()
      const html = toHtml(text)
      setData((prev) => ({ ...prev, body: html }))
    }
  }

  const handleRemoveFile = () => {
    setAttachedFile(null)
    setData((prev) => ({ ...prev, attachedFileName: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleGenerateAI = async () => {
    if (!attachedFile) {
      setAiError('참고 파일을 먼저 첨부해주세요.')
      return
    }
    const envApiKey = import.meta.env.VITE_OPENAI_API_KEY
    if (!envApiKey || envApiKey === '여기에_OpenAI_API_키_입력') {
      setAiError('.env 파일에 올바른 VITE_OPENAI_API_KEY를 설정해주세요.')
      return
    }
    setAiError('')
    setIsGenerating(true)
    try {
      const content = await attachedFile.text()
      const generated = await generateReportFromFile(
        content,
        attachedFile.name,
        data.title,
        data.recipient,
        envApiKey
      )
      const html = toHtml(generated)
      setData((prev) => ({ ...prev, body: html }))
    } catch (err) {
      setAiError(err?.message || 'AI 생성 중 오류가 발생했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      const filename = `${data.title || '보고서'}_${data.date}.pdf`
      await exportToPDF('document-preview', filename)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="app-layout">
      {/* ── 측정 div: 트랜스폼 바깥, 화면 밖에 고정 ── */}
      <div className="body-measure-root">
        <div
          ref={measureRef}
          className="doc-body-content"
          dangerouslySetInnerHTML={{ __html: data.body || '' }}
        />
      </div>
      {/* ── 상단 바 ── */}
      <header className="app-header">
        <div className="app-header-left">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="header-icon">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="white" strokeWidth="1.5" />
            <line x1="7" y1="8" x2="17" y2="8" stroke="white" strokeWidth="1.5" />
            <line x1="7" y1="12" x2="17" y2="12" stroke="white" strokeWidth="1.5" />
            <line x1="7" y1="16" x2="13" y2="16" stroke="white" strokeWidth="1.5" />
          </svg>
          <span className="app-title">보고서 작성 시스템</span>
        </div>
        <button
          className="btn-export btn-export-desktop"
          onClick={handleExportPDF}
          disabled={isExporting}
        >
          {isExporting ? (
            <span className="btn-spinner" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v13M7 11l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
          {isExporting ? 'PDF 변환 중...' : 'PDF로 저장'}
        </button>
      </header>

      <div className="app-body">
        {/* ── 좌측 폼 패널 ── */}
        <aside className={`form-panel ${isMobile && mobileView === 'preview' ? 'mobile-hidden' : ''}`}>
          <div className="form-scroll">

            {/* 기본 정보 섹션 */}
            <section className="form-section">
              <h3 className="section-title">
                <span className="section-icon">📋</span> 기본 정보
              </h3>
              <div className="field-grid-2">
                <div className="field">
                  <label>기관/회사명 <span className="required">*</span></label>
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
                  <input
                    type="text"
                    value={data.date}
                    onChange={set('date')}
                    className="input"
                  />
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

            {/* 수신/발신 섹션 */}
            <section className="form-section">
              <h3 className="section-title">
                <span className="section-icon">📨</span> 수신 / 발신
              </h3>
              <div className="field">
                <label>수신 <span className="required">*</span></label>
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

            {/* 결재자 섹션 */}
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
                    onClick={() => setData((prev) => ({ ...prev, showApproval: !prev.showApproval }))}
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

            {/* 직인 섹션 */}
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
                표지 및 본문의 직인 영역을 출력에 포함합니다.
              </p>
            </section>

            {/* 문서 내용 섹션 */}
            <section className="form-section">
              <h3 className="section-title">
                <span className="section-icon">📝</span> 문서 내용
              </h3>
              <div className="field">
                <label>제목 <span className="required">*</span></label>
                <input
                  type="text"
                  value={data.title}
                  onChange={set('title')}
                  placeholder="보고서 제목을 입력하세요"
                  className="input input-lg"
                />
              </div>
              <div className="field">
                <label>본문 <span className="required">*</span></label>
                <RichEditor
                  value={data.body}
                  onChange={(html) => setData((prev) => ({ ...prev, body: html }))}
                  placeholder="본문을 직접 입력하거나, 파일을 첨부하여 AI로 생성하세요."
                />
              </div>
            </section>

            {/* 보존기간 섹션 */}
            <section className="form-section">
              <h3 className="section-title">
                <span className="section-icon">🗂️</span> 보존기간
              </h3>
              <div className="retention-group">
                {RETENTION_OPTIONS.map((opt) => (
                  <label key={opt} className={`retention-chip ${data.retention === opt ? 'active' : ''}`}>
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

            {/* AI 첨부파일 섹션 */}
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
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="upload-icon">
                    <path d="M12 3v13M7 11l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M4 20h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span>클릭하여 파일 선택</span>
                  <span className="file-hint">.txt, .md 파일 지원</span>
                </label>
              ) : (
                <div className="file-attached">
                  <div className="file-info">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M13 2v7h7" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                    <span className="file-name">{attachedFile.name}</span>
                    <span className="file-size">
                      ({(attachedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button className="btn-remove-file" onClick={handleRemoveFile}>✕</button>
                </div>
              )}

              {aiError && <div className="ai-error">{aiError}</div>}

              <button
                className="btn-ai"
                onClick={handleGenerateAI}
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
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                    AI로 본문 생성
                  </>
                )}
              </button>
            </section>

          </div>

          {isMobile && (
            <div className="mobile-preview-sticky">
              <button
                type="button"
                className="btn-preview-mobile"
                onClick={() => setMobileView('preview')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7z" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                미리보기
              </button>
            </div>
          )}
        </aside>

        {/* ── 우측 미리보기 패널 ── */}
        <main className={`preview-panel ${isMobile && mobileView === 'preview' ? 'mobile-fullscreen' : ''} ${isMobile && mobileView === 'form' ? 'mobile-collapsed' : ''}`}>
          <div className="preview-toolbar">
            {isMobile && (
              <button
                type="button"
                className="btn-back-mobile"
                onClick={() => setMobileView('form')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                onClick={handleExportPDF}
                disabled={isExporting}
              >
                {isExporting ? (
                  <span className="btn-spinner btn-spinner-dark" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 3v13M7 11l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
                {isExporting ? '변환 중...' : 'PDF 저장'}
              </button>
            )}
          </div>
          <div className="preview-scroll" ref={previewScrollRef}>
            <ScaledPreview
              active={previewActive}
              maxScale={isMobile ? 1 : DEFAULT_SCALE}
            >
              <DocumentPages data={data} bodyChunks={bodyChunks} id="document-preview" />
            </ScaledPreview>
          </div>
        </main>
      </div>
    </div>
  )
}
