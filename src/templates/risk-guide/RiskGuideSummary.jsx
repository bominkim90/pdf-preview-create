export default function RiskGuideSummary({ summary }) {
  const { title, paragraphs = [] } = summary || {};
  const visibleParagraphs = paragraphs.filter((p) => p?.trim());

  if (!title?.trim() && !visibleParagraphs.length) {
    return null;
  }

  return (
    <div className="risk-guide-summary">
      <div className="risk-guide-summary-inner">
        {title?.trim() && (
          <div className="risk-guide-summary-heading">
            <p className="risk-guide-summary-title">
              <strong>{title}</strong>
            </p>
          </div>
        )}
        <div className="risk-guide-summary-body">
          {visibleParagraphs.map((html, i) => (
            <p key={i} dangerouslySetInnerHTML={{ __html: html }} />
          ))}
        </div>
      </div>
    </div>
  );
}
