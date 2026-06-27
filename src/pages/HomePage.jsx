import { Link, Navigate } from 'react-router-dom';
import AppVersionBadge from '../components/AppVersionBadge';
import { useAuth } from '../contexts/AuthContext';
import './AuthPage.css';

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-page">
        <p className="auth-message">로딩 중...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/documents" replace />;
  }

  return (
    <div className="auth-page">
      <div className="auth-card home-card">
        <div className="home-card-header">
          <h1 className="auth-title">보고서 작성 시스템</h1>
          <AppVersionBadge />
        </div>
        <p className="auth-subtitle">
          로그인하면 문서를 DB에 저장하고 목록에서 관리할 수 있습니다. 로그인 없이도 PDF만
          만들 수 있습니다.
        </p>
        <div className="home-actions">
          <Link to="/guest" className="home-btn home-btn-primary">
            비로그인 PDF 작성하기
          </Link>
          <Link to="/login" className="home-btn home-btn-secondary">
            로그인
          </Link>
          <Link to="/signup" className="home-btn home-btn-secondary">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
