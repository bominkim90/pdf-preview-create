import { useNavigate } from 'react-router-dom';
import {
  DownloadIcon,
  EraserIcon,
  FilePlusIcon,
  FileTextIcon,
  FolderOpenIcon,
  HomeIcon,
  Loader2Icon,
  LogInIcon,
  LogOutIcon,
  Trash2Icon,
  UserCircleIcon,
} from 'lucide-react';
import { getProfileDisplayName } from '../lib/auth';
import AppVersionBadge from './AppVersionBadge';
import HeaderIconButton from './HeaderIconButton';

export default function AppHeader({
  documentId,
  isGuestMode,
  isReadOnlyView,
  isRiskGuide,
  profile,
  isExporting,
  isDeleting,
  onExportPDF,
  onLogout,
  onLoadRiskExample,
  onClearRiskContent,
  onDeleteDocument,
}) {
  const navigate = useNavigate();
  const showDelete = Boolean(documentId && !isReadOnlyView && !isGuestMode);
  const showTools = isRiskGuide && !isReadOnlyView;
  const actionsDisabled = isExporting || isDeleting;

  return (
    <header className="app-header">
      <div className="app-header-left">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="header-icon shrink-0">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="white" strokeWidth="1.5" />
          <line x1="7" y1="8" x2="17" y2="8" stroke="white" strokeWidth="1.5" />
          <line x1="7" y1="12" x2="17" y2="12" stroke="white" strokeWidth="1.5" />
          <line x1="7" y1="16" x2="13" y2="16" stroke="white" strokeWidth="1.5" />
        </svg>
        <span className="app-title">보고서 작성 시스템</span>
        <AppVersionBadge />
        {getProfileDisplayName(profile) && !isGuestMode && (
          <span className="header-username">{getProfileDisplayName(profile)}</span>
        )}
        {documentId && !isGuestMode && (
          <span className="doc-saved-badge" title={documentId}>
            저장됨
          </span>
        )}
      </div>

      <div className="app-header-right app-header-toolbar">
        {isGuestMode ? (
          <>
            <HeaderIconButton label="홈" onClick={() => navigate('/')}>
              <HomeIcon />
            </HeaderIconButton>
            <HeaderIconButton label="로그인" onClick={() => navigate('/login')}>
              <LogInIcon />
            </HeaderIconButton>
          </>
        ) : (
          <>
            <HeaderIconButton label="문서 목록" onClick={() => navigate('/documents')}>
              <FolderOpenIcon />
            </HeaderIconButton>
            <HeaderIconButton label="새 문서" onClick={() => navigate('/new')}>
              <FilePlusIcon />
            </HeaderIconButton>
            {showTools && (
              <>
                <HeaderIconButton
                  label="예시 불러오기"
                  onClick={onLoadRiskExample}
                  disabled={actionsDisabled}
                >
                  <FileTextIcon />
                </HeaderIconButton>
                <HeaderIconButton
                  label="내용 비우기"
                  onClick={onClearRiskContent}
                  disabled={actionsDisabled}
                >
                  <EraserIcon />
                </HeaderIconButton>
              </>
            )}
            {showDelete && (
              <HeaderIconButton
                label={isDeleting ? '삭제 중...' : '문서 삭제'}
                onClick={onDeleteDocument}
                disabled={actionsDisabled}
                destructive
              >
                <Trash2Icon />
              </HeaderIconButton>
            )}
            <HeaderIconButton label="마이페이지" onClick={() => navigate('/mypage')}>
              <UserCircleIcon />
            </HeaderIconButton>
            <HeaderIconButton label="로그아웃" onClick={onLogout}>
              <LogOutIcon />
            </HeaderIconButton>
          </>
        )}

        <HeaderIconButton
          label={isExporting ? '저장 중...' : 'PDF로 저장'}
          onClick={onExportPDF}
          disabled={isExporting}
          primary
          className="btn-export-desktop"
        >
          {isExporting ? <Loader2Icon className="animate-spin" /> : <DownloadIcon />}
        </HeaderIconButton>
      </div>
    </header>
  );
}
