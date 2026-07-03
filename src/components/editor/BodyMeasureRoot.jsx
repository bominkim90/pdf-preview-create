import '../../templates/risk-guide/risk-guide.css';

export default function BodyMeasureRoot({ measureRef, bodyHtml, isRiskGuide = false }) {
  return (
    <div className={`body-measure-root${isRiskGuide ? ' body-measure-root--risk-guide' : ''}`}>
      <div
        ref={measureRef}
        className={isRiskGuide ? 'risk-guide-body doc-body-content' : 'doc-body-content'}
        dangerouslySetInnerHTML={{ __html: bodyHtml || '' }}
      />
    </div>
  );
}
