import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { marked } from 'marked';
import AppHeader from './components/AppHeader';
import DocumentPreview from './components/DocumentPreview';
import RichEditor from './components/RichEditor';
import { useAuth } from './contexts/AuthContext';
import { deleteDocument, getDocumentById, saveDocument } from './api/documents';
import { createInitialFormData, mergeLoadedFormData, CLOSING_PAGE_STYLE_OPTIONS } from './constants/documentSchema';
import { TEMPLATE_OPTIONS, isRiskGuideTemplate } from './templates/registry';
import {
  createRiskGuideBlank,
  createRiskGuideExample,
  createRiskGuideFormData,
} from './templates/risk-guide/defaults';
import { isSupabaseConfigured } from './lib/supabase';
import { generateReportFromFile } from './utils/aiHelper';
import { exportToPDF } from './utils/pdfExport';
import { isMaster, signOut } from './lib/auth';
import './document.css';
import './pages/AuthPage.css';
import './App.css';

marked.setOptions({ breaks: true, gfm: true });

const A4_WIDTH = 794;
const DEFAULT_SCALE = 0.72;
const MOBILE_BREAKPOINT = 768;

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    setMatches(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// ── 페이지 분할 상수 (document CSS px, 트랜스폼 미적용 기준) ──────────
// A4 1123px, padding 상 106 / 하 57 → inner 960px
const PAGE_INNER_H = 960;
const HEADER_BLOCK_H = 230; // 1면 헤더(수신·발신·제목·결재란)
const CONTINUED_BLOCK_H = 36; // 연속 페이지 표시줄

function getBodyLimit(isFirst) {
  const overhead = isFirst ? HEADER_BLOCK_H : CONTINUED_BLOCK_H;
  return Math.max(80, PAGE_INNER_H - overhead);
}

// 본문 HTML → 페이지별 청크 배열 계산 (트랜스폼 없는 위치에서 측정)
function useBodyChunks(body, measureRef) {
  const [chunks, setChunks] = useState(['']);

  useEffect(() => {
    const container = measureRef.current;
    if (!container) return;

    let timerId = null;

    const run = () => {
      const singlePageLimit = getBodyLimit(true);

      const children = [...container.children];
      if (!children.length) {
        setChunks([body || '']);
        return;
      }

      // offsetHeight: 트랜스폼 영향 없는 레이아웃 픽셀
      let totalH = 0;
      for (const c of children) totalH += c.offsetHeight;

      if (totalH <= singlePageLimit) {
        setChunks([body || '']);
        return;
      }

      const getAttributesString = (el) => {
        const attrs = [];
        for (const attr of el.attributes) {
          attrs.push(`${attr.name}="${attr.value.replace(/"/g, '&quot;')}"`);
        }
        return attrs.length ? ' ' + attrs.join(' ') : '';
      };

      const getTempHeight = (html) => {
        const temp = document.createElement('div');
        temp.className = 'doc-body-content';
        temp.style.width = '661px';
        temp.innerHTML = html;
        container.parentNode.appendChild(temp);
        const h = temp.offsetHeight;
        container.parentNode.removeChild(temp);
        return h;
      };

      // 평탄화 (리스트와 테이블 행 단위 분할 지원)
      const flatItems = [];
      for (const child of children) {
        if (child.tagName === 'UL' || child.tagName === 'OL') {
          const tag = child.tagName.toLowerCase();
          const attrs = getAttributesString(child);
          const listItems = [...child.children];
          for (const li of listItems) {
            flatItems.push({
              type: 'list-item',
              tagName: tag,
              attributes: attrs,
              html: li.outerHTML,
            });
          }
        } else if (child.tagName === 'TABLE') {
          const attrs = getAttributesString(child);
          const thead = child.querySelector('thead');
          const theadHtml = thead ? thead.outerHTML : '';
          const trs = [];
          const allTrs = child.querySelectorAll('tr');
          for (const tr of allTrs) {
            if (!tr.closest('thead')) {
              trs.push(tr);
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
              });
            }
          } else {
            flatItems.push({
              type: 'block',
              html: child.outerHTML,
            });
          }
        } else {
          flatItems.push({
            type: 'block',
            html: child.outerHTML,
          });
        }
      }

      const renderItems = (items) => {
        let html = '';
        let currentMode = 'none'; // 'none', 'list', 'table'
        let currentTag = '';
        let currentAttrs = '';
        let currentThead = '';

        const closeActiveContainer = () => {
          if (currentMode === 'list') {
            html += `</${currentTag}>`;
          } else if (currentMode === 'table') {
            html += `</tbody></${currentTag}>`;
          }
          currentMode = 'none';
          currentTag = '';
          currentAttrs = '';
          currentThead = '';
        };

        for (const item of items) {
          if (item.type === 'list-item') {
            if (
              currentMode !== 'list' ||
              currentTag !== item.tagName ||
              currentAttrs !== item.attributes
            ) {
              closeActiveContainer();
              html += `<${item.tagName}${item.attributes}>`;
              currentMode = 'list';
              currentTag = item.tagName;
              currentAttrs = item.attributes;
            }
            html += item.html;
          } else if (item.type === 'table-row') {
            if (
              currentMode !== 'table' ||
              currentTag !== item.tagName ||
              currentAttrs !== item.attributes ||
              currentThead !== item.theadHtml
            ) {
              closeActiveContainer();
              html += `<${item.tagName}${item.attributes}>`;
              if (item.theadHtml) {
                html += item.theadHtml;
              }
              html += '<tbody>';
              currentMode = 'table';
              currentTag = item.tagName;
              currentAttrs = item.attributes;
              currentThead = item.theadHtml;
            }
            html += item.html;
          } else {
            closeActiveContainer();
            html += item.html;
          }
        }
        closeActiveContainer();
        return html;
      };

      // 여러 페이지 분할
      const result = [];
      let currentPageItems = [];
      let isFirst = true;

      for (let i = 0; i < flatItems.length; i++) {
        const item = flatItems[i];
        const testItems = [...currentPageItems, item];
        const testHtml = renderItems(testItems);
        const h = getTempHeight(testHtml);

        const remainingItems = flatItems.slice(i + 1);

        let limit = getBodyLimit(isFirst);

        // 중간 페이지: 남은 본문이 많으면 하단 여백 없이 페이지를 더 채움
        if (remainingItems.length > 0) {
          const remainingHtml = renderItems(remainingItems);
          const remainingH = getTempHeight(remainingHtml);
          if (remainingH > 80) {
            limit = PAGE_INNER_H - (isFirst ? HEADER_BLOCK_H : CONTINUED_BLOCK_H);
          }
        }

        if (h > limit && currentPageItems.length > 0) {
          result.push(renderItems(currentPageItems));
          currentPageItems = [item];
          isFirst = false;
        } else {
          currentPageItems.push(item);
        }
      }

      if (currentPageItems.length > 0) {
        result.push(renderItems(currentPageItems));
      }

      setChunks(result.length ? result : [body || '']);
    };

    const debouncedRun = () => {
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(() => {
        document.fonts.ready.then(() => requestAnimationFrame(run));
      }, 100); // 100ms 디바운스로 반응 속도 극대화
    };

    debouncedRun();

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [body, measureRef]);

  return chunks;
}

// transform: scale()은 레이아웃 흐름에서 크기가 사라지므로
// wrapper는 absolute로 flow에서 분리하고, outer에 scaled 크기를 부여
function ScaledPreview({ children, maxScale = DEFAULT_SCALE, active = true }) {
  const wrapperRef = useRef(null);
  const outerRef = useRef(null);
  const [scale, setScale] = useState(maxScale);

  const updateScale = useCallback(() => {
    const scrollParent = outerRef.current?.parentElement;
    if (!scrollParent) return;
    const available = scrollParent.clientWidth - 32;
    if (available <= 0) return;
    const computed = Math.min(maxScale, available / A4_WIDTH);
    setScale(Math.max(0.35, computed));
  }, [maxScale]);

  useEffect(() => {
    if (!active) return;
    const scrollParent = outerRef.current?.parentElement;
    if (!scrollParent) return;

    updateScale();
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(updateScale);
    });

    const observer = new ResizeObserver(updateScale);
    observer.observe(scrollParent);
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [maxScale, active, updateScale]);

  useEffect(() => {
    if (!active || !wrapperRef.current || !outerRef.current) return;

    const updateHeight = () => {
      const h = wrapperRef.current.offsetHeight;
      outerRef.current.style.height = `${h * scale}px`;
      outerRef.current.style.width = `${A4_WIDTH * scale}px`;
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [scale, children, active]);

  useEffect(() => {
    if (!active) return;
    outerRef.current?.parentElement?.scrollTo(0, 0);
  }, [scale, active]);

  return (
    <div ref={outerRef} className="preview-scale-outer" style={{ width: `${A4_WIDTH * scale}px` }}>
      <div
        ref={wrapperRef}
        className="preview-scale-wrapper"
        style={{ transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

function toHtml(text) {
  return marked.parse(text);
}

const RETENTION_OPTIONS = ['영구', '준영구', '10년', '5년', '3년', '1년'];
const CLASSIFICATION_OPTIONS = ['일반문서', '대외비', '비밀', '기밀'];

export default function App() {
  const { id: routeDocumentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const userIsMaster = isMaster(profile);
  const [data, setData] = useState(() => createInitialFormData());
  const [documentId, setDocumentId] = useState(null);
  const [loadedAuthorId, setLoadedAuthorId] = useState(undefined);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [aiError, setAiError] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [mobileView, setMobileView] = useState('form');
  const fileInputRef = useRef(null);
  const measureRef = useRef(null);
  const previewScrollRef = useRef(null);
  const isMobile = useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT}px)`);
  const previewActive = !isMobile || mobileView === 'preview';

  const isRiskGuide = isRiskGuideTemplate(data.templateId);
  const isGuestMode = location.pathname === '/guest';
  const isReadOnlyView = Boolean(
    routeDocumentId &&
      loadedAuthorId !== undefined &&
      user &&
      loadedAuthorId !== user.id &&
      !userIsMaster
  );
  const canSaveToDb = isSupabaseConfigured() && !isReadOnlyView && !isGuestMode && user;

  useEffect(() => {
    if (!routeDocumentId) {
      const imported = location.state?.importFormData;
      if (imported) {
        setData(mergeLoadedFormData(imported));
        setDocumentId(null);
        setLoadedAuthorId(undefined);
        setLoadError('');
        setAttachedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        navigate(location.pathname, { replace: true, state: {} });
        return;
      }

      setData(createInitialFormData());
      setDocumentId(null);
      setLoadedAuthorId(undefined);
      setLoadError('');
      setAttachedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
        if (fileInputRef.current) fileInputRef.current.value = '';
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
  }, [routeDocumentId, location.state, location.pathname, navigate]);

  const handleCopyAsNewDocument = () => {
    navigate('/new', {
      state: {
        importFormData: mergeLoadedFormData(data),
      },
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

  useEffect(() => {
    if (!isMobile) setMobileView('form');
  }, [isMobile]);

  useEffect(() => {
    if (isMobile && mobileView === 'preview') {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isMobile, mobileView]);

  useEffect(() => {
    if (isMobile && mobileView === 'preview' && previewScrollRef.current) {
      requestAnimationFrame(() => {
        previewScrollRef.current?.scrollTo(0, 0);
      });
    }
  }, [isMobile, mobileView]);

  // 페이지 분할 청크 계산 (측정 div는 트랜스폼 바깥에 렌더링)
  const bodyChunks = useBodyChunks(data.body, measureRef);

  const set = useCallback(
    (field) => (e) => {
      const val = e.target ? e.target.value : e;
      setData((prev) => ({ ...prev, [field]: val }));
    },
    []
  );

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAttachedFile(file);
    setData((prev) => ({ ...prev, attachedFileName: file.name }));

    // .md 파일이면 즉시 파싱해서 에디터에 표시
    if (/\.(md|markdown)$/i.test(file.name)) {
      const text = await file.text();
      const html = toHtml(text);
      setData((prev) => ({ ...prev, body: html }));
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    setData((prev) => ({ ...prev, attachedFileName: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  const handleExportPDF = async () => {
    setIsExporting(true);

    let pdfOk = false;
    let pdfError = null;
    let dbOk = false;
    let dbError = null;
    let dbMessage = '';

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
        setDocumentId(result.id);
        if (result.isNew) {
          navigate(`/edit/${result.id}`, { replace: true });
        }
        dbOk = true;
        dbMessage = result.isNew ? '문서가 새로 저장되었습니다.' : '문서가 수정 저장되었습니다.';
      } catch (err) {
        dbError = err?.message || '문서 저장 중 오류가 발생했습니다.';
      }
    }

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

    setIsExporting(false);
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
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (routeDocumentId) navigate('/new', { replace: true });

    if (isRiskGuideTemplate(nextId)) {
      setData(createRiskGuideFormData());
    } else {
      setData(createInitialFormData());
    }
  };

  const handleLoadRiskExample = () => {
    if (!window.confirm('예시 내용으로 덮어씁니다. 계속할까요?')) return;
    setData(createRiskGuideExample());
  };

  const handleClearRiskContent = () => {
    if (!window.confirm('제목·작성자·본문을 비웁니다. 계속할까요?')) return;
    setData(createRiskGuideBlank());
  };

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
      <AppHeader
        documentId={documentId}
        isGuestMode={isGuestMode}
        isReadOnlyView={isReadOnlyView}
        isRiskGuide={isRiskGuide}
        profile={profile}
        isExporting={isExporting}
        isDeleting={isDeleting}
        onExportPDF={handleExportPDF}
        onLogout={handleLogout}
        onLoadRiskExample={handleLoadRiskExample}
        onClearRiskContent={handleClearRiskContent}
        onDeleteDocument={handleDeleteDocument}
      />

      {isGuestMode && (
        <div className="guest-banner" role="status">
          비로그인 모드입니다. PDF만 저장할 수 있으며 DB에는 저장되지 않습니다.
        </div>
      )}
      {isLoadingDoc && (
        <div className="editor-loading-banner" role="status">
          문서를 불러오는 중...
        </div>
      )}
      {loadError && (
        <div className="editor-error-banner" role="alert">
          {loadError}
        </div>
      )}
      {isReadOnlyView && (
        <div className="readonly-banner" style={{ margin: '0 16px' }}>
          <span>
            다른 사용자의 문서입니다. 수정할 수 없으며, 내용을 복사해 새 문서로 저장할 수
            있습니다.
          </span>
          <div className="readonly-banner-actions">
            <button type="button" className="btn-readonly-copy" onClick={handleCopyAsNewDocument}>
              내 계정으로 새 문서 만들기
            </button>
          </div>
        </div>
      )}

      <div className="app-body">
        {/* ── 좌측 폼 패널 ── */}
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
                  onChange={handleTemplateChange}
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
                {/* 기본 정보 섹션 */}
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
                    표지 및 끝장의 직인 영역을 출력에 포함합니다.
                  </p>
                </section>

                {/* 끝장 레이아웃 */}
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
                          onChange={() =>
                            setData((prev) => ({ ...prev, closingPageStyle: value }))
                          }
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* 문서 내용 섹션 */}
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
                {/* 보존기간 섹션 */}
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
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="upload-icon"
                      >
                        <path
                          d="M12 3v13M7 11l5-5 5 5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M4 20h16"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
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
                        <span className="file-size">
                          ({(attachedFile.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button className="btn-remove-file" onClick={handleRemoveFile}>
                        ✕
                      </button>
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

        {/* ── 우측 미리보기 패널 ── */}
        <main
          className={`preview-panel ${isMobile && mobileView === 'preview' ? 'mobile-fullscreen' : ''} ${isMobile && mobileView === 'form' ? 'mobile-collapsed' : ''}`}
        >
          <div className="preview-toolbar">
            {isMobile && (
              <button
                type="button"
                className="btn-back-mobile"
                onClick={() => setMobileView('form')}
              >
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
                onClick={handleExportPDF}
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
                templateId={data.templateId}
                data={data}
                bodyChunks={bodyChunks}
                id="document-preview"
              />
            </ScaledPreview>
          </div>
        </main>
      </div>
    </div>
  );
}
