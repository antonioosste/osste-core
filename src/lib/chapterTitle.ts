/**
 * Shared chapter title resolution.
 * 
 * SINGLE SOURCE OF TRUTH: chapters.title
 * 
 * Priority:
 * 1. chapter.title (the canonical title — may be user-edited or auto-set from AI)
 * 2. session.title (legacy fallback)
 * 3. session.story_anchor (the prompt used)
 * 4. Fallback: "Untitled Chapter"
 * 
 * NOTE: suggested_cover_title is NOT used for display.
 * It is only shown as a suggestion inside the ChapterDetail page.
 */
export function getChapterDisplayTitle(
  sessionData?: { title?: string | null; story_anchor?: string | null; started_at?: string | null } | null,
  chapterData?: { title?: string | null; suggested_cover_title?: string | null } | null,
): string {
  if (chapterData?.title) return chapterData.title;
  if (sessionData?.title) return sessionData.title;
  if (sessionData?.story_anchor) return sessionData.story_anchor;
  return "Untitled Chapter";
}
