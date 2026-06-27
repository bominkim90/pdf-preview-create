import { getSupabase } from '../lib/supabase';
import { getDocumentTitle } from '../constants/documentSchema';

async function requireUserId() {
  const supabase = getSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('로그인이 필요합니다.');
  return user.id;
}

async function attachAuthorNicknames(rows) {
  if (!rows?.length) return [];

  const authorIds = [...new Set(rows.map((row) => row.author_id).filter(Boolean))];
  let profileMap = {};

  if (authorIds.length) {
    const supabase = getSupabase();
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, nickname')
      .in('id', authorIds);

    if (error) throw error;
    profileMap = Object.fromEntries(
      (profiles ?? []).map((p) => [p.id, p.nickname?.trim() || null])
    );
  }

  return rows.map((row) => ({
    ...row,
    author_nickname: row.author_id ? profileMap[row.author_id] ?? null : null,
  }));
}

export async function listDocuments({ mineOnly = false } = {}) {
  const supabase = getSupabase();
  let query = supabase
    .from('documents')
    .select('id, title, template_id, author_id, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (mineOnly) {
    const userId = await requireUserId();
    query = query.eq('author_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return attachAuthorNicknames(data ?? []);
}

export async function getDocumentById(id) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('documents')
    .select('id, title, template_id, form_data, author_id, created_at, updated_at')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function saveDocument({ documentId, formData }) {
  const supabase = getSupabase();
  const userId = await requireUserId();
  const templateId = formData.templateId || 'report-default';
  const title = getDocumentTitle(formData);
  const payload = {
    title,
    template_id: templateId,
    form_data: formData,
    updated_at: new Date().toISOString(),
  };

  if (documentId) {
    const { data, error } = await supabase
      .from('documents')
      .update(payload)
      .eq('id', documentId)
      .select('id')
      .single();

    if (error) throw error;
    return { id: data.id, isNew: false };
  }

  const { data, error } = await supabase
    .from('documents')
    .insert({
      title: payload.title,
      template_id: payload.template_id,
      form_data: payload.form_data,
      author_id: userId,
    })
    .select('id')
    .single();

  if (error) throw error;
  return { id: data.id, isNew: true };
}

export async function deleteDocument(id) {
  const supabase = getSupabase();
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw error;
}
