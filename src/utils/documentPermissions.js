import { isSupabaseConfigured } from '../lib/supabase';

export function computeEditorPermissions({
  routeDocumentId,
  loadedAuthorId,
  user,
  userIsMaster,
  pathname,
}) {
  const isGuestMode = pathname === '/guest';
  const isReadOnlyView = Boolean(
    routeDocumentId &&
      loadedAuthorId !== undefined &&
      user &&
      loadedAuthorId !== user.id &&
      !userIsMaster
  );
  const canSaveToDb = isSupabaseConfigured() && !isReadOnlyView && !isGuestMode && Boolean(user);

  return { isGuestMode, isReadOnlyView, canSaveToDb };
}
