import { ArrowLeft, Mic, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface MobileChapterReaderProps {
  title: string;
  bodyText: string;
  bookId?: string | null;
  bookTitle?: string | null;
  sessionId?: string | null;
}

const FOLLOW_UP_PROMPTS = [
  "What happened next?",
  "Tell me more about this moment",
  "Who else was involved?",
];

/**
 * Mobile-only clean reader for a chapter. Renders plain text paragraphs,
 * a "Continue this story" CTA, and a few follow-up prompt suggestions.
 *
 * Used as a mobile overlay inside ChapterDetail without altering desktop UI.
 */
export function MobileChapterReader({
  title,
  bodyText,
  bookId,
  bookTitle,
  sessionId,
}: MobileChapterReaderProps) {
  const navigate = useNavigate();

  const goBack = () => {
    if (bookId) navigate(`/books/${bookId}`);
    else navigate(-1);
  };

  const continueStory = () => {
    if (sessionId) {
      navigate(bookId ? `/session?id=${sessionId}&bookId=${bookId}` : `/session?id=${sessionId}`);
      return;
    }
    if (bookId) navigate(`/session?bookId=${bookId}&mode=non-guided`);
    else navigate("/session");
  };

  // Strip markdown headers/bold for a clean read; preserve paragraphs.
  const clean = (bodyText || "")
    .replace(/^#{1,6}\s+.*$/gm, "") // remove headings (chapter title is shown above)
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .trim();

  const paragraphs = clean
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md px-4 pt-safe-top">
        <div className="flex items-center justify-between h-14">
          <button
            onClick={goBack}
            className="flex items-center gap-1 text-sm text-muted-foreground active:opacity-60"
          >
            <ArrowLeft className="h-4 w-4" />
            {bookTitle ? bookTitle : "Back"}
          </button>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
            Chapter
          </span>
          <span className="w-10" />
        </div>
      </div>

      {/* Content */}
      <article className="px-6 pt-4 pb-32 max-w-prose mx-auto">
        <h1 className="font-serif text-3xl font-bold text-foreground leading-tight mb-6">
          {title}
        </h1>

        {paragraphs.length === 0 ? (
          <p className="text-muted-foreground italic">
            This chapter is still being prepared.
          </p>
        ) : (
          paragraphs.map((p, i) => (
            <p
              key={i}
              className="text-[17px] leading-[1.75] text-foreground/90 mb-5 font-serif"
            >
              {p}
            </p>
          ))
        )}

        {/* Follow-up prompts */}
        <div className="mt-10 pt-6 border-t border-border/30">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-primary/70" />
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Where to next?
            </p>
          </div>
          <div className="space-y-2">
            {FOLLOW_UP_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={continueStory}
                className="w-full text-left p-3 rounded-xl bg-primary/5 border border-primary/10 active:bg-primary/10 transition-colors text-sm text-foreground/80 italic"
              >
                “{prompt}”
              </button>
            ))}
          </div>
        </div>
      </article>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-20 px-5 pt-3 pb-6 bg-gradient-to-t from-background via-background/95 to-transparent">
        <Button
          size="lg"
          className="w-full h-14 rounded-2xl gap-2 shadow-md"
          onClick={continueStory}
        >
          <Mic className="h-5 w-5" />
          Continue this story
        </Button>
      </div>
    </div>
  );
}
