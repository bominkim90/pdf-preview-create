import DocOfficialBlock from './DocOfficialBlock';
import ClosingBranding from './ClosingBranding';

/** 끝장 — 위→아래 흐름형: 재산 문구(페이지 중앙) + 공문·결재 정보(하단) */
export default function ClosingPageFlow({ data }) {
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
    <div className="a4-page closing-page closing-page--flow">
      <div className="closing-flow-inner">
        <div className="closing-flow-center">
          <div className="closing-branding">
            <ClosingBranding orgName={orgName} date={date} />
          </div>
        </div>
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
          variant="flow"
        />
      </div>
    </div>
  );
}
