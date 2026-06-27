import { getSupabase } from './supabase';

export const AUTH_EMAIL_DOMAIN = 'istagingisa.com';

export const PROFILE_ROLE = {
  USER: 'user',
  MASTER: 'master',
};

export function isMaster(profile) {
  return profile?.role === PROFILE_ROLE.MASTER;
}

const LOGIN_ID_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
const NICKNAME_PATTERN = /^[\w가-힣]{2,20}$/u;

export function validateLoginId(loginId) {
  const trimmed = loginId?.trim() ?? '';
  if (!LOGIN_ID_PATTERN.test(trimmed)) {
    return '아이디는 영문, 숫자, 밑줄(_) 3~20자로 입력하세요.';
  }
  return null;
}

export function validateNickname(nickname) {
  const trimmed = nickname?.trim() ?? '';
  if (!NICKNAME_PATTERN.test(trimmed)) {
    return '닉네임은 한글, 영문, 숫자, 밑줄(_) 2~20자로 입력하세요.';
  }
  return null;
}

export function getProfileDisplayName(profile) {
  if (!profile) return null;
  return profile.nickname?.trim() || null;
}

function deriveNickname(user) {
  const fromMeta = user.user_metadata?.nickname?.trim();
  if (fromMeta && validateNickname(fromMeta) === null) {
    return fromMeta;
  }

  const localPart = (user.email?.split('@')[0] ?? 'user').trim();
  if (validateNickname(localPart) === null) {
    return localPart;
  }

  return '사용자';
}

export function loginIdToEmail(loginId) {
  return `${loginId.trim().toLowerCase()}@${AUTH_EMAIL_DOMAIN}`;
}

export async function fetchProfile(userId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, nickname, role, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function ensureProfile(user) {
  if (!user?.id) return null;

  const existing = await fetchProfile(user.id);
  if (existing) return existing;

  const email = (user.email ?? '').trim().toLowerCase();
  if (!email) {
    throw new Error('계정 이메일 정보를 확인할 수 없습니다.');
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email,
      nickname: deriveNickname(user),
      role: PROFILE_ROLE.USER,
    })
    .select('id, email, nickname, role, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return fetchProfile(user.id);
    }
    throw error;
  }
  return data;
}

export async function signUpWithUsername({ username, nickname, password }) {
  const loginIdError = validateLoginId(username);
  if (loginIdError) throw new Error(loginIdError);
  const nicknameError = validateNickname(nickname);
  if (nicknameError) throw new Error(nicknameError);
  if (!password || password.length < 6) {
    throw new Error('비밀번호는 6자 이상 입력하세요.');
  }

  const supabase = getSupabase();
  const normalizedLoginId = username.trim().toLowerCase();
  const normalizedNickname = nickname.trim();
  const email = loginIdToEmail(normalizedLoginId);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { email, nickname: normalizedNickname },
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error('회원가입에 실패했습니다.');

  const { error: profileError } = await supabase.from('profiles').insert({
    id: data.user.id,
    email,
    nickname: normalizedNickname,
  });

  if (profileError) {
    throw new Error(profileError.message || '프로필 생성에 실패했습니다.');
  }

  return data;
}

export async function signInWithUsername({ username, password }) {
  const loginIdError = validateLoginId(username);
  if (loginIdError) throw new Error(loginIdError);
  if (!password) throw new Error('비밀번호를 입력하세요.');

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: loginIdToEmail(username),
    password,
  });

  if (error) throw error;
  return data;
}

export async function updateProfileNickname(nickname) {
  const nicknameError = validateNickname(nickname);
  if (nicknameError) throw new Error(nicknameError);

  const supabase = getSupabase();
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('로그인이 필요합니다.');

  const { data, error } = await supabase
    .from('profiles')
    .update({ nickname: nickname.trim() })
    .eq('id', userId)
    .select('id, email, nickname, role, created_at')
    .single();

  if (error) throw error;
  return data;
}

export async function updatePassword(newPassword) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('비밀번호는 6자 이상 입력하세요.');
  }

  const supabase = getSupabase();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function signOut() {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUserId() {
  const supabase = getSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  return user?.id ?? null;
}
