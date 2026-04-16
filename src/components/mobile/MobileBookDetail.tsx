import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Mic,
  BookOpen,
  Sparkles,
  Plus,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useStoryGroups } from "@/hooks/useStoryGroups";
import { useSessions } from "@/hooks/useSessions";
import { useChapters } from "@/hooks/useChapters";
import { useStories } from "@/hooks/useStories";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { assembleStory } from "@/lib/backend-api";
import { supabase } from "@/integrations/supabase/client";
import { getChapterDisplayTitle } from "@/lib/chapterTitle";
import { MobileLayout } from "./MobileLayout";

type TimelineItem =
  | {
      kind: "session";
      id: string;
      sessionId: string;
      title: string;
      date: string | null;
      durationSec: number;
      hasContent: boolean;
    }
  | {
      kind: "chapter";
      id: string;
      sessionId: string;
      title: string;
      date: string | null;
      preview: string;
    };

const CONTINUATION_PROMPTS = [
  "What happened next?",
  "Tell me more about this moment",
  "Who else was involved?",
  "How did that make you feel?",
];

function relativeDate(date: string | null): string {
  if (!date) return "";
  const d = new Date(date);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDuration(seconds: number): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m} min`;
}

export function MobileBookDetail() {
  const navigate = useNavigate();
  const { id: bookId } = useParams();
  const { toast } = useToast();
  const { session } = useAuth();
  const { getStoryGroup } = useStoryGroups();
  const { sessions } = useSessions();
  const { chapters, refetch: refetchChapters } = useChapters();
  const { stories, refetch: refetchStories } = useStories();

  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recordingsBySession, setRecordingsBySession] = useState<Record<string, number>>({});
  const [isAssembling, setIsAssembling] = useState(false);
  const [completionChapter, setCompletionChapter] = useState<{ title: string; sessionId: string } | null>(null);
  const [seenChapterIds, setSeenChapterIds] = useState<Set<string>>(new Set());

  const bookSessions = useMemo(
    () => sessions.filter((s) => s.story_group_id === bookId),
    [sessions, bookId]
  );
  const bookChapters = useMemo(
    () => chapters.filter((c) => bookSessions.some((s) => s.id === c.session_id)),
    [chapters, bookSessions]
  );
  const bookStory = stories.find((s) => s.story_group_id === bookId);

  // Load book
  useEffect(() => {
    if (!bookId) return;
    (async () => {
      try {
        setLoading(true);
        const data = await getStoryGroup(bookId);
        setBook(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [bookId]);

  // Fetch recording durations per session
  useEffect(() => {
    if (bookSessions.length === 0) return;
    (async () => {
      const ids = bookSessions.map((s) => s.id);
      const { data } = await supabase
        .from("recordings")
        .select("session_id, duration_seconds")
        .in("session_id", ids);
      const map: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        if (!r.session_id) return;
        map[r.session_id] = (map[r.session_id] || 0) + (r.duration_seconds || 0);
      });
      setRecordingsBySession(map);
    })();
  }, [bookSessions.length]);

  // Initialize seen chapter set on first load
  useEffect(() => {
    if (bookChapters.length > 0 && seenChapterIds.size === 0) {
      setSeenChapterIds(new Set(bookChapters.map((c) => c.id)));
    }
  }, [bookChapters.length]);

  // Detect newly generated chapters → trigger completion screen
  useEffect(() => {
    if (seenChapterIds.size === 0 && bookChapters.length === 0) return;
    const fresh = bookChapters.find((c) => !seenChapterIds.has(c.id));
    if (fresh && fresh.session_id) {
      const sess = bookSessions.find((s) => s.id === fresh.session_id);
      setCompletionChapter({
        title: getChapterDisplayTitle(sess, fresh),
        sessionId: fresh.session_id,
      });
      setSeenChapterIds((prev) => new Set([...prev, ...bookChapters.map((c) => c.id)]));
    }
  }, [bookChapters.length]);

  // Build chronological timeline
  const timeline: TimelineItem[] = useMemo(() => {
    const items: TimelineItem[] = [];
    bookSessions.forEach((s) => {
      const chapter = bookChapters.find((c) => c.session_id === s.id);
      const duration = recordingsBySession[s.id] || 0;
      items.push({
        kind: "session",
        id: `s-${s.id}`,
        sessionId: s.id,
        title: s.title || s.story_anchor || "Recording Session",
        date: s.started_at,
        durationSec: duration,
        hasContent: duration > 0 || !!chapter,
      });
      if (chapter) {
        const text = chapter.polished_text || chapter.summary || chapter.raw_transcript || "";
        items.push({
          kind: "chapter",
          id: `c-${chapter.id}`,
          sessionId: s.id,
          title: getChapterDisplayTitle(s, chapter),
          date: chapter.created_at,
          preview: text.replace(/[#*_>`]/g, "").trim().substring(0, 140),
        });
      }
    });
    items.sort((a, b) => {
      const ta = a.date ? new Date(a.date).getTime() : 0;
      const tb = b.date ? new Date(b.date).getTime() : 0;
      return ta - tb;
    });
    return items;
  }, [bookSessions, bookChapters, recordingsBySession]);

  // Find a session to resume (most recent without a generated chapter)
  const resumableSession = useMemo(() => {
    const sorted = [...bookSessions].sort((a, b) => {
      const ta = a.started_at ? new Date(a.started_at).getTime() : 0;
      const tb = b.started_at ? new Date(b.started_at).getTime() : 0;
      return tb - ta;
    });
    return sorted.find((s) => !bookChapters.some((c) => c.session_id === s.id));
  }, [bookSessions, bookChapters]);

  const handleContinueStory = () => {
    if (resumableSession) {
      navigate(`/session?sessionId=${resumableSession.id}&bookId=${bookId}`);
    } else {
      navigate(`/session?bookId=${bookId}`);
    }
  };

  const handleAssembleStory = async () => {
    if (!session?.access_token || bookSessions.length === 0) return;
    setIsAssembling(true);
    try {
      await assembleStory(session.access_token, bookSessions[0].id, null);
      await refetchStories();
      toast({ title: "Your story is ready", description: "Tap to read it now" });
    } catch (e) {
      toast({
        title: "Couldn't assemble story",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setIsAssembling(false);
    }
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="px-5 pt-14 space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </MobileLayout>
    );
  }

  if (!book) {
    return (
      <MobileLayout>
        <div className="px-5 pt-14 text-center">
          <p className="text-muted-foreground mb-4">Book not found</p>
          <Button onClick={() => navigate("/stories")}>Go back</Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="px-5 pt-safe-top pb-32">
        {/* Header */}
        <div className="flex items-center gap-2 pt-10 pb-4 -ml-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/stories")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm text-muted-foreground">All books</span>
        </div>

        {/* Book title */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-3xl font-serif font-bold text-foreground leading-tight mb-2">
            {book.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {bookSessions.length} {bookSessions.length === 1 ? "recording" : "recordings"} ·{" "}
            {bookChapters.length} {bookChapters.length === 1 ? "chapter" : "chapters"}
          </p>
        </div>

        {/* Timeline */}
        {timeline.length === 0 ? (
          <div className="flex flex-col items-center text-center py-12 animate-fade-in">
            <div className="h-16 w-16 rounded-full bg-primary/8 flex items-center justify-center mb-5">
              <Sparkles className="h-7 w-7 text-primary/60" />
            </div>
            <h2 className="text-lg font-serif font-semibold text-foreground mb-2">
              Your story starts here
            </h2>
            <p className="text-sm text-muted-foreground max-w-[260px] mb-6">
              Record your first memory and watch this book come to life.
            </p>
            <Button
              size="lg"
              onClick={handleContinueStory}
              className="h-14 rounded-2xl px-8 gap-2 shadow-md"
            >
              <Mic className="h-5 w-5" />
              Start recording
            </Button>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border/60" aria-hidden />

            <div className="space-y-4">
              {timeline.map((item, idx) => (
                <div
                  key={item.id}
                  className="relative pl-12 animate-fade-in"
                  style={{ animationDelay: `${Math.min(idx * 60, 400)}ms` }}
                >
                  {/* Node icon */}
                  <div
                    className={`absolute left-0 top-3 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                      item.kind === "session"
                        ? "bg-primary/10 text-primary"
                        : "bg-accent/40 text-foreground"
                    }`}
                  >
                    {item.kind === "session" ? (
                      <Mic className="h-4 w-4" />
                    ) : (
                      <BookOpen className="h-4 w-4" />
                    )}
                  </div>

                  {item.kind === "session" ? (
                    <button
                      onClick={() =>
                        navigate(`/session?sessionId=${item.sessionId}&bookId=${bookId}`)
                      }
                      className="w-full text-left rounded-2xl bg-card border border-border/50 p-4 active:scale-[0.98] transition-transform"
                    >
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <span className="text-xs uppercase tracking-wide text-muted-foreground/70 font-medium">
                          Recording
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {relativeDate(item.date)}
                        </span>
                      </div>
                      <h3 className="text-base font-medium text-foreground line-clamp-2 mb-2">
                        {item.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(item.durationSec)}
                        </span>
                        <span className="text-xs text-primary font-medium">
                          {item.hasContent ? "Continue →" : "Start →"}
                        </span>
                      </div>
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/chapters/${item.sessionId}`)}
                      className="w-full text-left rounded-2xl bg-card border border-border/50 p-4 active:scale-[0.98] transition-transform"
                    >
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <span className="text-xs uppercase tracking-wide text-muted-foreground/70 font-medium">
                          Chapter
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {relativeDate(item.date)}
                        </span>
                      </div>
                      <h3 className="text-base font-serif font-semibold text-foreground line-clamp-2 mb-1.5">
                        {item.title}
                      </h3>
                      {item.preview && (
                        <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed mb-2">
                          {item.preview}…
                        </p>
                      )}
                      <span className="text-xs text-primary font-medium">Read chapter →</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Assemble story option */}
            {bookChapters.length >= 2 && !bookStory?.raw_text && !bookStory?.edited_text && (
              <div className="mt-6 rounded-2xl bg-accent/20 p-5 text-center animate-fade-in">
                <Sparkles className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground mb-1">
                  Ready to weave it together?
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Turn your chapters into one flowing story.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAssembleStory}
                  disabled={isAssembling}
                  className="rounded-xl"
                >
                  {isAssembling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Weaving…
                    </>
                  ) : (
                    "Assemble your story"
                  )}
                </Button>
              </div>
            )}

            {bookStory && (bookStory.raw_text || bookStory.edited_text) && (
              <button
                onClick={() => navigate(`/stories/${bookStory.id}`)}
                className="mt-6 w-full rounded-2xl bg-primary/5 border border-primary/20 p-4 text-left active:scale-[0.98] transition-transform animate-fade-in"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Read the full story</p>
                    <p className="text-xs text-muted-foreground">All your chapters, woven into one</p>
                  </div>
                </div>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sticky primary CTA */}
      {timeline.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-5 pb-3 pointer-events-none z-30">
          <div className="pointer-events-auto bg-gradient-to-t from-background via-background to-transparent pt-6 pb-2 -mx-5 px-5">
            <Button
              size="lg"
              onClick={handleContinueStory}
              className="w-full h-14 rounded-2xl text-base gap-2 shadow-lg"
            >
              {resumableSession ? (
                <>
                  <Mic className="h-5 w-5" />
                  Continue this story
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Add a new chapter
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Completion modal */}
      <Dialog
        open={!!completionChapter}
        onOpenChange={(open) => !open && setCompletionChapter(null)}
      >
        <DialogContent className="mx-4 rounded-3xl border-0 max-w-sm p-0 overflow-hidden">
          <div className="px-6 pt-10 pb-6 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5 animate-scale-in">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Your chapter is ready
            </p>
            <h2 className="text-2xl font-serif font-semibold text-foreground leading-tight mb-2">
              {completionChapter?.title}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {book?.title} just grew stronger.
            </p>

            <div className="space-y-2 mb-6">
              <Button
                size="lg"
                className="w-full h-13 rounded-2xl"
                onClick={() => {
                  if (completionChapter) {
                    navigate(`/chapters/${completionChapter.sessionId}`);
                  }
                  setCompletionChapter(null);
                }}
              >
                Read your chapter
              </Button>
              <Button
                variant="ghost"
                className="w-full h-12 rounded-2xl"
                onClick={() => {
                  setCompletionChapter(null);
                  handleContinueStory();
                }}
              >
                Continue storytelling
              </Button>
            </div>

            <div className="text-left">
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70 mb-2">
                Want to go deeper?
              </p>
              <div className="space-y-1.5">
                {CONTINUATION_PROMPTS.slice(0, 3).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setCompletionChapter(null);
                      navigate(`/session?bookId=${bookId}&prompt=${encodeURIComponent(p)}`);
                    }}
                    className="w-full text-left text-sm text-foreground/90 px-3 py-2.5 rounded-xl bg-muted/40 hover:bg-muted active:scale-[0.98] transition-all"
                  >
                    → {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
