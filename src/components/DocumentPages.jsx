import '../document.css';

const RETENTION_LABELS = {
  영구: '영구',
  준영구: '준영구',
  '10년': '10년',
  '5년': '5년',
  '3년': '3년',
  '1년': '1년',
};

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
function DocHeader({ docNumber, recipient, via, sender, orgName, date, title }) {
  return (
    <>
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

// ── 문서 푸터 (붙임·보존기간·발신명의·기안자행) ────────────────────
function DocFooter({
  attachedFileName,
  retention,
  sender,
  orgName,
  showSeal,
  showApproval,
  author,
  reviewer,
  approver,
  date,
}) {
  return (
    <>
      {attachedFileName && (
        <>
          <hr className="doc-divider-thin" />
          <div className="doc-attachments">
            <span className="doc-attachment-label">붙&emsp;&emsp;임</span>
            {'  :  1. ' + attachedFileName + ' 1부.  끝.'}
          </div>
        </>
      )}
      <div className="doc-retention">보존기간 : {RETENTION_LABELS[retention] || retention}</div>
      <div className="doc-footer">
        <div className="doc-sender-name">{sender || orgName || '발신명의'}</div>
        {showSeal && <div className="doc-seal">직인</div>}
      </div>
      {showApproval && (
        <div className="doc-drafter-row">
          <div className="doc-drafter-item">
            <span className="doc-drafter-role">기안자</span>
            <span className="doc-drafter-name">{author || ''}</span>
          </div>
          {reviewer && (
            <div className="doc-drafter-item">
              <span className="doc-drafter-role">검토자</span>
              <span className="doc-drafter-name">{reviewer}</span>
            </div>
          )}
          {approver && (
            <div className="doc-drafter-item">
              <span className="doc-drafter-role">결재자</span>
              <span className="doc-drafter-name">{approver}</span>
            </div>
          )}
          <div style={{ flex: 1 }} />
          <div className="doc-drafter-item">
            <span className="doc-drafter-role">협조자</span>
            <span className="doc-drafter-name" />
          </div>
          <div className="doc-drafter-item">
            <span className="doc-drafter-role">시행일자</span>
            <span className="doc-drafter-name">{date}</span>
          </div>
        </div>
      )}
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
    retention,
    attachedFileName,
    author,
    reviewer,
    approver,
    department,
    docNumber,
    date,
    classification,
    showApproval,
    showSeal,
  } = data;

  const chunks = bodyChunks?.length ? bodyChunks : [body || ''];

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
        const isLast = i === chunks.length - 1;
        return (
          <div key={i} className="a4-page body-page">
            {/* 결재란 — 첫 페이지만 */}
            {isFirst && showApproval && (
              <ApprovalBlock author={author} reviewer={reviewer} approver={approver} />
            )}

            {/* 헤더 정보 — 첫 페이지만 */}
            {isFirst && (
              <DocHeader
                docNumber={docNumber}
                recipient={recipient}
                via={via}
                sender={sender}
                orgName={orgName}
                date={date}
                title={title}
              />
            )}

            {/* 연속 페이지 표시 */}
            {!isFirst && (
              <div className="doc-page-continued">
                <span>{title || '(제목 없음)'}</span>
                <span className="doc-page-num">— {i + 1} —</span>
              </div>
            )}

            {/* 본문 청크 */}
            <div
              className="doc-body-content"
              dangerouslySetInnerHTML={{
                __html: chunk || '<p style="color:#aaa">(본문을 입력하거나 AI로 생성하세요)</p>',
              }}
            />

            {/* 푸터 — 마지막 페이지만 */}
            {isLast && (
              <DocFooter
                attachedFileName={attachedFileName}
                retention={retention}
                sender={sender}
                orgName={orgName}
                showSeal={showSeal}
                showApproval={showApproval}
                author={author}
                reviewer={reviewer}
                approver={approver}
                date={date}
              />
            )}
          </div>
        );
      })}

      {/* ── 마지막 장 ── */}
      <div className="a4-page closing-page">
        <div className="closing-content">
          <img src="/logo.jpg" alt={orgName || '기관명'} className="closing-logo" />
          <p className="closing-statement">
            이 문서는 <span className="closing-org">{orgName || '기관/회사명'}</span>의 재산입니다.
          </p>
          <p className="closing-sub">무단 복제·배포·유출을 금지합니다.</p>
          <div className="closing-divider" />
          <p className="closing-date">{date}</p>
        </div>
      </div>
    </div>
  );
}
