/**
 * Shared chapter title resolution following the strict title hierarchy.
 * Priority: 1. Session title (user-edited) → 2. Chapter suggested_cover_title (AI-suggested) 
 * → 3. Session story_anchor (prompt) → 4. Chapter title (AI-generated) → 5. Fallback
 */
export function getChapterDisplayTitle(
  sessionData?: { title?: string | null; story_anchor?: string | null; started_at?: string | null } | null,
  chapterData?: { suggested_cover_title?: string | null; title?: string | null } | null,
): string {
  if (sessionData?.title) return sessionData.title;
  if (chapterData?.suggested_cover_title) return chapterData.suggested_cover_title;
  if (sessionData?.story_anchor) return sessionData.story_anchor;
  if (chapterData?.title) return chapterData.title;
  return "Untitled Chapter";
}
