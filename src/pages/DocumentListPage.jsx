import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { deleteDocument, listDocuments } from '../api/documents'
import { getTemplateLabel } from '../constants/documentSchema'
import { isSupabaseConfigured } from '../lib/supabase'
import './DocumentListPage.css'

function formatDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function DocumentListPage() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const handleDelete = async (e, doc) => {
    e.stopPropagation()
    const label = doc.title || '제목 없음'
    if (!window.confirm(`「${label}」 문서를 삭제할까요?\n삭제 후에는 되돌릴 수 없습니다.`)) {
      return
    }

    setDeletingId(doc.id)
    setError('')

    try {
      await deleteDocument(doc.id)
      setDocuments((prev) => prev.filter((row) => row.id !== doc.id))
    } catch (err) {
      setError(err?.message || '문서 삭제에 실패했습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setError('.env에 Supabase 설정이 필요합니다.')
      setIsLoading(false)
      return
    }

    let cancelled = false

    listDocuments()
      .then((rows) => {
        if (!cancelled) setDocuments(rows)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || '문서 목록을 불러오지 못했습니다.')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="list-page">
      <header className="list-header">
        <div className="list-header-left">
          <h1 className="list-title">저장된 문서</h1>
          <span className="list-count">{documents.length}건</span>
        </div>
        <div className="list-header-right">
          <Link to="/" className="btn-list-nav btn-list-nav-primary">
            새 문서 작성
          </Link>
        </div>
      </header>

      <main className="list-main">
        {isLoading && <p className="list-message">목록을 불러오는 중...</p>}
        {!isLoading && error && <p className="list-message list-error">{error}</p>}
        {!isLoading && !error && documents.length === 0 && (
          <div className="list-empty">
            <p>저장된 문서가 없습니다.</p>
            <Link to="/" className="btn-list-nav btn-list-nav-primary">
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
                  <th>템플릿</th>
                  <th>작성일</th>
                  <th>수정일</th>
                  <th aria-label="삭제" />
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="list-row"
                    onClick={() => navigate(`/edit/${doc.id}`)}
                  >
                    <td className="list-cell-title">{doc.title || '제목 없음'}</td>
                    <td>{getTemplateLabel(doc.template_id)}</td>
                    <td>{formatDate(doc.created_at)}</td>
                    <td>{formatDate(doc.updated_at)}</td>
                    <td className="list-cell-actions">
                      <button
                        type="button"
                        className="btn-list-delete"
                        disabled={deletingId === doc.id}
                        onClick={(e) => handleDelete(e, doc)}
                      >
                        {deletingId === doc.id ? '삭제 중...' : '삭제'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
