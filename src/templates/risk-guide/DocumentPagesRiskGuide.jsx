import '../../document.css';
import './risk-guide.css';

export default function DocumentPagesRiskGuide({ data, bodyChunks, id }) {
  const { title, author, date, body } = data;
  const chunks = bodyChunks?.length ? bodyChunks : [body || ''];

  return (
    <div id={id} className="doc-pages-wrapper risk-guide-wrapper">
      {chunks.map((chunk, i) => {
        const isFirst = i === 0;
        const isLast = i === chunks.length - 1;
        return (
          <div key={i} className="a4-page risk-guide-page">
            {isFirst && (
              <header className="risk-guide-header">
                <div className="risk-guide-title-block">
                  <hr className="risk-guide-title-line" />
                  <h1 className="risk-guide-title">{title || '업무 리스크 관리'}</h1>
                  <hr className="risk-guide-title-line" />
                </div>
                <div className="risk-guide-meta">
                  <div className="risk-guide-meta-row">
                    <span className="risk-guide-meta-label">작성자</span>
                    <span>{author || '(작성자)'}</span>
                  </div>
                  <div className="risk-guide-meta-row">
                    <span className="risk-guide-meta-label">작성일</span>
                    <span>{date}</span>
                  </div>
                </div>
              </header>
            )}

            {!isFirst && (
              <div className="risk-guide-continued">
                <span>{title || '업무 리스크 관리'}</span>
                <span className="risk-guide-page-num">— {i + 1} —</span>
              </div>
            )}

            <div
              className="risk-guide-body doc-body-content"
              dangerouslySetInnerHTML={{
                __html: chunk || '<p style="color:#aaa">(본문을 입력하세요)</p>',
              }}
            />

            {isLast && (
              <footer className="risk-guide-footer">
                <img src="/logo.jpg" alt="iStaging Asia" className="risk-guide-logo" />
              </footer>
            )}
          </div>
        );
      })}
    </div>
  );
}
