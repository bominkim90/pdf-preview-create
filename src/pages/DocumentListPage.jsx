import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FilePlusIcon, Loader2Icon, LogOutIcon, Trash2Icon, UserCircleIcon } from 'lucide-react';
import AppVersionBadge from '../components/AppVersionBadge';
import HeaderIconButton from '../components/HeaderIconButton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { deleteDocument, listDocuments } from '../api/documents';
import { useAuth } from '../contexts/AuthContext';
import { getTemplateLabel } from '../constants/documentSchema';
import { isMaster, signOut } from '../lib/auth';
import { isSupabaseConfigured } from '../lib/supabase';
import './DocumentListPage.css';
import './AuthPage.css';

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DocumentListPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const userIsMaster = isMaster(profile);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [listFilter, setListFilter] = useState('all');

  const loadList = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError('.env에 Supabase 설정이 필요합니다.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const rows = await listDocuments({ mineOnly: listFilter === 'mine' });
      setDocuments(rows);
    } catch (err) {
      setError(err?.message || '문서 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [listFilter]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err?.message || '로그아웃에 실패했습니다.');
    }
  };

  const handleDelete = async (e, doc) => {
    e.stopPropagation();
    const label = doc.title || '제목 없음';
    if (!window.confirm(`「${label}」 문서를 삭제할까요?\n삭제 후에는 되돌릴 수 없습니다.`)) {
      return;
    }

    setDeletingId(doc.id);
    setError('');

    try {
      await deleteDocument(doc.id);
      setDocuments((prev) => prev.filter((row) => row.id !== doc.id));
    } catch (err) {
      setError(err?.message || '문서 삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  const isOwnDocument = (doc) => user?.id && doc.author_id === user.id;
  const canDeleteDocument = (doc) => userIsMaster || isOwnDocument(doc);

  return (
    <div className="list-page">
      <header className="list-header">
        <div className="list-header-left">
          <h1 className="list-title">저장된 문서</h1>
          <AppVersionBadge />
          <span className="list-count">{documents.length}건</span>
        </div>
        <div className="list-header-right list-header-toolbar">
          <HeaderIconButton label="새 문서" onClick={() => navigate('/new')}>
            <FilePlusIcon />
          </HeaderIconButton>
          <HeaderIconButton label="마이페이지" onClick={() => navigate('/mypage')}>
            <UserCircleIcon />
          </HeaderIconButton>
          <HeaderIconButton label="로그아웃" onClick={handleLogout}>
            <LogOutIcon />
          </HeaderIconButton>
        </div>
      </header>

      <main className="list-main">
        <div className="list-filter">
          <button
            type="button"
            className={`list-filter-btn${listFilter === 'all' ? ' active' : ''}`}
            onClick={() => setListFilter('all')}
          >
            전체 보기
          </button>
          <button
            type="button"
            className={`list-filter-btn${listFilter === 'mine' ? ' active' : ''}`}
            onClick={() => setListFilter('mine')}
          >
            내 문서만
          </button>
        </div>

        {isLoading && <p className="list-message">목록을 불러오는 중...</p>}
        {!isLoading && error && <p className="list-message list-error">{error}</p>}
        {!isLoading && !error && documents.length === 0 && (
          <div className="list-empty">
            <p>{listFilter === 'mine' ? '내 문서가 없습니다.' : '저장된 문서가 없습니다.'}</p>
            <Link to="/new" className="btn-list-nav btn-list-nav-primary">
              첫 문서 작성하기
            </Link>
          </div>
        )}
        {!isLoading && !error && documents.length > 0 && (
          <div className="list-table-wrap">
            <table className="list-table">
              <thead>
                <tr>
                  <th>제목</th>
                  <th>작성자</th>
                  <th>템플릿</th>
                  <th>작성일</th>
                  <th>수정일</th>
                  <th aria-label="삭제" />
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const isOwn = isOwnDocument(doc);
                  const isDeleting = deletingId === doc.id;

                  return (
                    <tr
                      key={doc.id}
                      className={`list-row${isOwn ? ' list-row-mine' : ''}`}
                      onClick={() => navigate(`/edit/${doc.id}`)}
                    >
                      <td className="list-cell-title">{doc.title || '제목 없음'}</td>
                      <td className="list-cell-muted">{doc.author_nickname || '(미지정)'}</td>
                      <td>{getTemplateLabel(doc.template_id)}</td>
                      <td>{formatDate(doc.created_at)}</td>
                      <td>{formatDate(doc.updated_at)}</td>
                      <td className="list-cell-actions">
                        {canDeleteDocument(doc) ? (
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="btn-list-delete-icon"
                                  disabled={isDeleting}
                                  aria-label={isDeleting ? '삭제 중...' : '삭제'}
                                  onClick={(e) => handleDelete(e, doc)}
                                />
                              }
                            >
                              {isDeleting ? (
                                <Loader2Icon className="animate-spin" />
                              ) : (
                                <Trash2Icon />
                              )}
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              {isDeleting ? '삭제 중...' : '삭제'}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="list-cell-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
