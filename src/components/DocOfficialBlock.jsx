const RETENTION_LABELS = {
  영구: '영구',
  준영구: '준영구',
  '10년': '10년',
  '5년': '5년',
  '3년': '3년',
  '1년': '1년',
};

/** 끝장용 공문 메타 (붙임·보존기간·발신명의·기안자행) */
export default function DocOfficialBlock({
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
  variant = 'flow',
}) {
  return (
    <div className={`doc-official-block doc-official-block--${variant}`}>
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
          <div className="doc-drafter-spacer" />
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
    </div>
  );
}
