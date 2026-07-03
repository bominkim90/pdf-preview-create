import '../../document.css';
import './risk-guide.css';
import { splitRiskGuideBody } from './splitBody';

export default function DocumentPagesRiskGuide({ data, bodyChunks, id }) {
  const { title, author, date, body } = data;
  const fixedChunks = splitRiskGuideBody(body);
  const chunks = fixedChunks ?? (bodyChunks?.length ? bodyChunks : [body || '']);

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
                <div className="risk-guide-title-block">
                  <hr className="risk-guide-title-line" />
                  <h1 className="risk-guide-title">{title || '업무 리스크 관리'}</h1>
                  <hr className="risk-guide-title-line risk-guide-title-line--thin" />
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
              </header>
            )}

            <div
              className="risk-guide-body doc-body-content"
              dangerouslySetInnerHTML={{
                __html: chunk || '<p style="color:#aaa">(본문을 입력하세요)</p>',
              }}
            />

            <footer className="risk-guide-footer">
              <img src="/logo.jpg" alt="iStaging Asia" className="risk-guide-logo" />
              <span className="risk-guide-footer-page">- {i + 1} -</span>
            </footer>
          </div>
        );
      })}
    </div>
  );
}
