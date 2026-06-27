import '../document.css';
import ClosingPageCenter from './ClosingPageCenter';
import ClosingPageFlow from './ClosingPageFlow';
import { CLOSING_PAGE_FLOW } from '../constants/documentSchema';

// ── 결재란 ──────────────────────────────────────────────────────────
function ApprovalBlock({ author, reviewer, approver }) {
  return (
    <div className="approval-block">
      <table className="approval-table">
        <tbody>
          <tr>
            <td>
              <div className="approval-role">기안</div>
              <div className="approval-sign" />
              <div className="approval-date">{author || ''}</div>
            </td>
            <td>
              <div className="approval-role">검토</div>
              <div className="approval-sign" />
              <div className="approval-date">{reviewer || ''}</div>
            </td>
            <td>
              <div className="approval-role">결재</div>
              <div className="approval-sign" />
              <div className="approval-date">{approver || ''}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ── 문서 헤더 (수신·발신·제목) ────────────────────────────────────
function DocHeader({
  docNumber,
  recipient,
  via,
  sender,
  orgName,
  date,
  title,
  showApproval,
  author,
  reviewer,
  approver,
}) {
  return (
    <>
      <div className="doc-header-top">
        <div className="doc-header-info">
          {docNumber && (
            <div className="doc-info-row">
              <span className="doc-info-label">문서번호</span>
              <span className="doc-info-colon">:</span>
              <span className="doc-info-value">{docNumber}</span>
            </div>
          )}
          <div className="doc-info-row">
            <span className="doc-info-label">수&emsp;&emsp;신</span>
            <span className="doc-info-colon">:</span>
            <span className="doc-info-value">{recipient || '(수신자 없음)'}</span>
          </div>
          {via && (
            <div className="doc-info-row">
              <span className="doc-info-label">경&emsp;&emsp;유</span>
              <span className="doc-info-colon">:</span>
              <span className="doc-info-value">{via}</span>
            </div>
          )}
          <div className="doc-info-row">
            <span className="doc-info-label">발&emsp;&emsp;신</span>
            <span className="doc-info-colon">:</span>
            <span className="doc-info-value">{sender || orgName || '(발신자 없음)'}</span>
          </div>
          <div className="doc-info-row">
            <span className="doc-info-label">시&emsp;&emsp;행</span>
            <span className="doc-info-colon">:</span>
            <span className="doc-info-value">{date}</span>
          </div>
        </div>
        {showApproval && (
          <ApprovalBlock author={author} reviewer={reviewer} approver={approver} />
        )}
      </div>
      <hr className="doc-divider" />
      <div className="doc-subject-row">
        <span className="doc-subject-label">제&emsp;&emsp;목</span>
        <span className="doc-info-colon">:</span>
        <span className="doc-subject-value">{title || '(제목 없음)'}</span>
      </div>
      <hr className="doc-divider" />
    </>
  );
}

// ── 메인 컴포넌트 ───────────────────────────────────────────────────
export default function DocumentPages({ data, bodyChunks, id }) {
  const {
    orgName,
    recipient,
    via,
    sender,
    title,
    body,
    author,
    reviewer,
    approver,
    department,
    docNumber,
    date,
    classification,
    showApproval,
    showSeal,
    closingPageStyle,
  } = data;

  const chunks = bodyChunks?.length ? bodyChunks : [body || ''];
  const ClosingPage =
    closingPageStyle === CLOSING_PAGE_FLOW ? ClosingPageFlow : ClosingPageCenter;

  return (
    <div id={id} className="doc-pages-wrapper">
      {/* ── 표지 ── */}
      <div className="a4-page cover-page">
        <div className="cover-top">
          <img src="/logo.jpg" alt={orgName || '기관명'} className="cover-logo" />
          <span className="cover-classification">{classification || '일반문서'}</span>
        </div>
        <hr className="cover-divider-top" />
        <div className="cover-center">
          <div className="cover-doc-type">보 고 서</div>
          <div className="cover-title">{title || '보고서 제목을 입력하세요'}</div>
          {department && <div className="cover-subtitle">{department}</div>}
        </div>
        <hr className="cover-divider-bottom" />
        <div className="cover-bottom">
          <div className="cover-meta-row">
            <span className="cover-meta-label">작 성 일</span>
            <span className="cover-meta-colon"> : </span>
            <span className="cover-meta-value">{date}</span>
          </div>
          {department && (
            <div className="cover-meta-row">
              <span className="cover-meta-label">작성부서</span>
              <span className="cover-meta-colon"> : </span>
              <span className="cover-meta-value">{department}</span>
            </div>
          )}
          {author && (
            <div className="cover-meta-row">
              <span className="cover-meta-label">작 성 자</span>
              <span className="cover-meta-colon"> : </span>
              <span className="cover-meta-value">{author}</span>
            </div>
          )}
          {docNumber && (
            <div className="cover-meta-row">
              <span className="cover-meta-label">문서번호</span>
              <span className="cover-meta-colon"> : </span>
              <span className="cover-meta-value">{docNumber}</span>
            </div>
          )}
          {showSeal && <div className="cover-stamp-area">직인</div>}
        </div>
      </div>

      {/* ── 본문 페이지들 (페이지 단위로 분할) ── */}
      {chunks.map((chunk, i) => {
        const isFirst = i === 0;
        return (
          <div key={i} className="a4-page body-page">
            {isFirst && (
              <DocHeader
                docNumber={docNumber}
                recipient={recipient}
                via={via}
                sender={sender}
                orgName={orgName}
                date={date}
                title={title}
                showApproval={showApproval}
                author={author}
                reviewer={reviewer}
                approver={approver}
              />
            )}

            {!isFirst && (
              <div className="doc-page-continued">
                <span>{title || '(제목 없음)'}</span>
                <span className="doc-page-num">— {i + 1} —</span>
              </div>
            )}

            <div
              className="doc-body-content"
              dangerouslySetInnerHTML={{
                __html: chunk || '<p style="color:#aaa">(본문을 입력하거나 AI로 생성하세요)</p>',
              }}
            />
          </div>
        );
      })}

      {/* ── 끝장 (공문 정보 + 재산 문구) ── */}
      <ClosingPage data={data} />
    </div>
  );
}

// 하위 호환
export { default as DocFooter } from './DocOfficialBlock';
