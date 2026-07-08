import '../../document.css';
import './risk-guide.css';
import RiskGuideSummary from './RiskGuideSummary';

const EMPTY_BODY_PLACEHOLDER = '<p class="risk-guide-body-placeholder">(본문을 입력하세요)</p>';

export default function DocumentPagesRiskGuide({ data, bodyChunks, id }) {
  const { title, author, date, summary } = data;
  const chunks = Array.isArray(bodyChunks) && bodyChunks.length > 0 ? bodyChunks : [''];

  return (
    <div id={id} className="doc-pages-wrapper risk-guide-wrapper">
      {chunks.map((chunk, i) => {
        const isFirst = i === 0;
        const isLastPage = i === chunks.length - 1;
        return (
          <div
            key={i}
            className={`a4-page risk-guide-page${isLastPage ? ' risk-guide-page--watermark' : ''}`}
          >
            {isFirst && (
              <header className="risk-guide-header">
                <div className="risk-guide-title-shell">
                  <div
                    className="risk-guide-title-line risk-guide-title-line--top"
                    aria-hidden="true"
                  />
                  <div className="risk-guide-title-block">
                    <h1 className={`risk-guide-title${title?.trim() ? '' : ' risk-guide-title--empty'}`}>
                      {title?.trim() || '문서 제목'}
                    </h1>
                  </div>
                  <div
                    className="risk-guide-title-line risk-guide-title-line--bottom"
                    aria-hidden="true"
                  />
                </div>
                <div className="risk-guide-meta">
                  <div className="risk-guide-meta-row">
                    <span className="risk-guide-meta-label">작성자 :</span>
                    <span>{author || '(작성자)'}</span>
                  </div>
                  <div className="risk-guide-meta-row">
                    <span className="risk-guide-meta-label">작성일 :</span>
                    <span>{date}</span>
                  </div>
                </div>
                <RiskGuideSummary summary={summary} />
              </header>
            )}

            <div
              className={`risk-guide-body doc-body-content${isFirst ? ' risk-guide-body--first' : ''}`}
              dangerouslySetInnerHTML={{
                __html: chunk?.trim() ? chunk : EMPTY_BODY_PLACEHOLDER,
              }}
            />

            <footer className="risk-guide-footer">
              <div className="risk-guide-footer-row">
                <img src="/logo.jpg" alt="iStaging Asia" className="risk-guide-logo" />
                <span className="risk-guide-footer-page">- {i + 1} -</span>
              </div>
            </footer>
          </div>
        );
      })}
    </div>
  );
}
