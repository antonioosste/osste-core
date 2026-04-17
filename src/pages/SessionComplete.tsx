import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, BookOpen, Mic, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getChapterDisplayTitle } from "@/lib/chapterTitle";

/**
 * Mobile-first completion celebration after a chapter is generated.
 * Lives at /session/complete?sessionId=...
 *
 * Behavior:
 *  - Looks up the session and (best-effort) its chapter.
 *  - Offers two CTAs: Read chapter / Continue story.
 *  - If no chapter is found yet, still surfaces a graceful success message
 *    and a "Back to your book" button.
 */
export default function SessionComplete() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get("sessionId");

  const [loading, setLoading] = useState(true);
  const [bookId, setBookId] = useState<string | null>(null);
  const [bookTitle, setBookTitle] = useState<string>("Your story");
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [chapterTitle, setChapterTitle] = useState<string>("Your new chapter");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }
      try {
        const { data: session } = await supabase
          .from("sessions")
          .select("id, title, story_group_id, story_anchor")
          .eq("id", sessionId)
          .maybeSingle();

        if (cancelled) return;

        if (session?.story_group_id) {
          setBookId(session.story_group_id);
          const { data: book } = await supabase
            .from("story_groups")
            .select("title")
            .eq("id", session.story_group_id)
            .maybeSingle();
          if (!cancelled && book?.title) setBookTitle(book.title);
        }

        const { data: chapter } = await supabase
          .from("chapters")
          .select("id, title, suggested_cover_title")
          .eq("session_id", sessionId)
          .maybeSingle();

        if (!cancelled && chapter) {
          setChapterId(chapter.id);
          setChapterTitle(getChapterDisplayTitle(session, chapter));
        }
      } catch (e) {
        console.error("SessionComplete load error", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const handleRead = () => {
    if (chapterId) navigate(`/chapters/${chapterId}`);
    else if (bookId) navigate(`/books/${bookId}`);
    else navigate("/dashboard");
  };

  const handleContinue = () => {
    if (bookId) navigate(`/session?bookId=${bookId}&mode=non-guided`);
    else navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 18, stiffness: 200 }}
        className="relative mb-8"
      >
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl scale-150" />
        <div className="relative h-20 w-20 rounded-full bg-primary/15 flex items-center justify-center">
          <Sparkles className="h-9 w-9 text-primary" />
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="max-w-sm"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-primary/70 font-medium mb-3">
          Chapter ready
        </p>
        <h1 className="text-3xl font-serif font-bold text-foreground leading-tight">
          {loading ? "Saving your chapter…" : "Your chapter is ready"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground italic">
          {loading
            ? "One moment while we finish polishing it."
            : `“${bookTitle}” just grew stronger.`}
        </p>
        {!loading && chapterTitle && (
          <p className="mt-5 text-base font-serif text-foreground/90">
            {chapterTitle}
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-sm mt-10 space-y-3"
      >
        <Button
          size="lg"
          className="w-full h-14 rounded-2xl text-base gap-2 shadow-md"
          onClick={handleRead}
          disabled={loading}
        >
          <BookOpen className="h-5 w-5" />
          Read chapter
          <ArrowRight className="h-4 w-4 ml-auto opacity-70" />
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full h-14 rounded-2xl text-base gap-2"
          onClick={handleContinue}
          disabled={loading}
        >
          <Mic className="h-5 w-5" />
          Continue this story
        </Button>
        <button
          onClick={() => navigate("/dashboard")}
          className="w-full text-xs text-muted-foreground/70 mt-2 active:opacity-60"
        >
          Back to home
        </button>
      </motion.div>
    </div>
  );
}
