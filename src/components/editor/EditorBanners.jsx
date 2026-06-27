import { useEffect, useState } from 'react';

function BannerCloseButton({ onClose, label = '배너 닫기' }) {
  return (
    <button
      type="button"
      className="editor-banner-close"
      onClick={onClose}
      aria-label={label}
    >
      ×
    </button>
  );
}

function DismissibleBanner({ visible, resetKey, className, role, children }) {
  const [dismissed, setDismissed] = useState(false);
  const resetSignal = resetKey ?? visible;

  useEffect(() => {
    if (visible) {
      setDismissed(false);
    }
  }, [visible, resetSignal]);

  if (!visible || dismissed) {
    return null;
  }

  return (
    <div className={`${className} editor-banner`} role={role}>
      <div className="editor-banner-content">{children}</div>
      <BannerCloseButton onClose={() => setDismissed(true)} />
    </div>
  );
}

export default function EditorBanners({
  isGuestMode,
  isLoadingDoc,
  loadError,
  isReadOnlyView,
  onCopyAsNewDocument,
}) {
  return (
    <>
      <DismissibleBanner
        visible={isGuestMode}
        className="guest-banner"
        role="status"
      >
        비로그인 모드입니다. PDF만 저장할 수 있으며 DB에는 저장되지 않습니다.
      </DismissibleBanner>

      <DismissibleBanner
        visible={isLoadingDoc}
        className="editor-loading-banner"
        role="status"
      >
        문서를 불러오는 중...
      </DismissibleBanner>

      <DismissibleBanner
        visible={Boolean(loadError)}
        resetKey={loadError}
        className="editor-error-banner"
        role="alert"
      >
        {loadError}
      </DismissibleBanner>

      <DismissibleBanner
        visible={isReadOnlyView}
        className="readonly-banner"
        role="status"
      >
        <span>
          다른 사용자의 문서입니다. 수정할 수 없으며, 내용을 복사해 새 문서로 저장할 수
          있습니다.
        </span>
        <div className="readonly-banner-actions">
          <button type="button" className="btn-readonly-copy" onClick={onCopyAsNewDocument}>
            내 계정으로 새 문서 만들기
          </button>
        </div>
      </DismissibleBanner>
    </>
  );
}
