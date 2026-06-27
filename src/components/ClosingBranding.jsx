/** 끝장 하단·중앙 공통 — 로고, 재산 문구, 날짜 */
export default function ClosingBranding({ orgName, date }) {
  return (
    <>
      <img src="/logo.jpg" alt={orgName || '기관명'} className="closing-logo" />
      <p className="closing-statement">
        이 문서는 <span className="closing-org">{orgName || '기관/회사명'}</span>의 재산입니다.
      </p>
      <p className="closing-sub">무단 복제·배포·유출을 금지합니다.</p>
      <div className="closing-divider" />
      <p className="closing-date">{date}</p>
    </>
  );
}
