export default function BodyMeasureRoot({ measureRef, bodyHtml }) {
  return (
    <div className="body-measure-root">
      <div
        ref={measureRef}
        className="doc-body-content"
        dangerouslySetInnerHTML={{ __html: bodyHtml || '' }}
      />
    </div>
  );
}
