import { getSupabase } from './supabase';

export const AUTH_EMAIL_DOMAIN = 'istagingisa.com';

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

export function validateUsername(username) {
  const trimmed = username?.trim() ?? '';
  if (!USERNAME_PATTERN.test(trimmed)) {
    return '아이디는 영문, 숫자, 밑줄(_) 3~20자로 입력하세요.';
  }
  return null;
}

export function usernameToEmail(username) {
  return `${username.trim().toLowerCase()}@${AUTH_EMAIL_DOMAIN}`;
}

export async function fetchProfile(userId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function signUpWithUsername({ username, password }) {
  const usernameError = validateUsername(username);
  if (usernameError) throw new Error(usernameError);
  if (!password || password.length < 6) {
    throw new Error('비밀번호는 6자 이상 입력하세요.');
  }

  const supabase = getSupabase();
  const email = usernameToEmail(username);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username: username.trim().toLowerCase() },
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error('회원가입에 실패했습니다.');

  const { error: profileError } = await supabase.from('profiles').insert({
    id: data.user.id,
    username: username.trim().toLowerCase(),
  });

  if (profileError) {
    throw new Error(profileError.message || '프로필 생성에 실패했습니다.');
  }

  return data;
}

export async function signInWithUsername({ username, password }) {
  const usernameError = validateUsername(username);
  if (usernameError) throw new Error(usernameError);
  if (!password) throw new Error('비밀번호를 입력하세요.');

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });

  if (error) throw error;
  return data;
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
