import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AUTH_EMAIL_DOMAIN, signInWithUsername } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';
import './AuthPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="auth-page">
        <p className="auth-message">로딩 중...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    const redirectTo = location.state?.from || '/documents';
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signInWithUsername({ username, password });
      const redirectTo = location.state?.from || '/documents';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err?.message || '로그인에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">로그인</h1>
        <p className="auth-subtitle">아이디와 비밀번호로 로그인하세요.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="login-username">아이디</label>
            <div className="auth-username-row">
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="영문, 숫자, _ (3~20자)"
              />
              <span className="auth-username-suffix">@{AUTH_EMAIL_DOMAIN}</span>
            </div>
          </div>
          <div className="auth-field">
            <label htmlFor="login-password">비밀번호</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <p className="auth-footer">
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </p>
        <p className="auth-footer">
          <Link to="/">비로그인으로 이용하기</Link>
        </p>
      </div>
    </div>
  );
}
