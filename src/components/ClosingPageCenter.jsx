import DocOfficialBlock from './DocOfficialBlock';
import ClosingBranding from './ClosingBranding';

/** 끝장 — 중앙 모음형: 공문 정보 + 재산 문구를 페이지 중앙에 세로로 배치 */
export default function ClosingPageCenter({ data }) {
  const {
    orgName,
    retention,
    attachedFileName,
    sender,
    showSeal,
    showApproval,
    author,
    reviewer,
    approver,
    date,
  } = data;

  return (
    <div className="a4-page closing-page closing-page--center">
      <div className="closing-content">
        <DocOfficialBlock
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
          variant="center"
        />
        <ClosingBranding orgName={orgName} date={date} />
      </div>
    </div>
  );
}
