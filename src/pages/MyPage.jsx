import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import AppVersionBadge from '../components/AppVersionBadge';
import { getProfileDisplayName, updatePassword, updateProfileNickname } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';
import './AuthPage.css';
import './MyPage.css';

export default function MyPage() {
  const { profile, refreshProfile } = useAuth();
  const [nickname, setNickname] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [nicknameSubmitting, setNicknameSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  useEffect(() => {
    setNickname(profile?.nickname ?? '');
  }, [profile?.nickname]);

  const handleNicknameSubmit = async (e) => {
    e.preventDefault();
    setNicknameSubmitting(true);
    try {
      await updateProfileNickname(nickname);
      await refreshProfile();
      toast.success('닉네임이 저장되었습니다.');
    } catch (err) {
      toast.error(err?.message || '닉네임 저장에 실패했습니다.');
    } finally {
      setNicknameSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== newPasswordConfirm) {
      toast.error('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setPasswordSubmitting(true);
    try {
      await updatePassword(newPassword);
      setNewPassword('');
      setNewPasswordConfirm('');
      toast.success('비밀번호가 변경되었습니다.');
    } catch (err) {
      toast.error(err?.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  if (!profile) {
    return (
      <div className="auth-page">
        <div className="auth-card my-page-card">
          <h1 className="auth-title">마이페이지</h1>
          <p className="auth-message">프로필 정보를 불러올 수 없습니다.</p>
          <p className="auth-footer">
            <Link to="/documents">문서 목록으로</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card my-page-card">
        <div className="my-page-header">
          <h1 className="auth-title">마이페이지</h1>
          <AppVersionBadge />
        </div>
        <p className="auth-subtitle">
          {getProfileDisplayName(profile) ? `${getProfileDisplayName(profile)}님, ` : ''}
          계정 정보를 관리하세요.
        </p>

        <section className="my-page-section">
          <h2 className="my-page-section-title">계정 정보</h2>
          <div className="auth-field">
            <label htmlFor="my-email">이메일</label>
            <div className="my-page-readonly" id="my-email">
              {profile.email}
            </div>
          </div>
        </section>

        <section className="my-page-section">
          <h2 className="my-page-section-title">닉네임</h2>
          <form className="auth-form" onSubmit={handleNicknameSubmit}>
            <div className="auth-field">
              <label htmlFor="my-nickname">닉네임</label>
              <input
                id="my-nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="한글, 영문, 숫자, _ (2~20자)"
              />
            </div>
            <button type="submit" className="auth-submit" disabled={nicknameSubmitting}>
              {nicknameSubmitting ? '저장 중...' : '닉네임 저장'}
            </button>
          </form>
        </section>

        <section className="my-page-section">
          <h2 className="my-page-section-title">비밀번호 변경</h2>
          <form className="auth-form" onSubmit={handlePasswordSubmit}>
            <div className="auth-field">
              <label htmlFor="my-new-password">새 비밀번호</label>
              <input
                id="my-new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="6자 이상"
              />
            </div>
            <div className="auth-field">
              <label htmlFor="my-new-password-confirm">새 비밀번호 확인</label>
              <input
                id="my-new-password-confirm"
                type="password"
                autoComplete="new-password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
              />
            </div>
            <button type="submit" className="auth-submit" disabled={passwordSubmitting}>
              {passwordSubmitting ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        </section>

        <p className="auth-footer">
          <Link to="/documents">문서 목록으로</Link>
        </p>
      </div>
    </div>
  );
}
