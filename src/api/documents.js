import { getSupabase } from '../lib/supabase';
import { getDocumentTitle } from '../constants/documentSchema';

export async function listDocuments() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('documents')
    .select('id, title, template_id, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getDocumentById(id) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('documents')
    .select('id, title, template_id, form_data, created_at, updated_at')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function saveDocument({ documentId, formData }) {
  const supabase = getSupabase();
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
