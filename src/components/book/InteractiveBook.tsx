import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BookPage {
  type: "cover" | "title" | "toc" | "chapter-start" | "content" | "image" | "back-cover";
  title?: string;
  subtitle?: string;
  author?: string;
  content?: string;
  imageUrl?: string;
  imageCaption?: string;
  chapterNumber?: number;
  pageNumber?: number;
}

interface Chapter {
  title: string;
  content: string;
  images?: { url: string; caption?: string }[];
}

interface InteractiveBookProps {
  title: string;
  subtitle?: string;
  author?: string;
  chapters: Chapter[];
  onClose?: () => void;
}

const WORDS_PER_PAGE = 200;

function splitContentIntoPages(content: string, wordsPerPage: number): string[] {
  const words = content.split(/\s+/);
  const pages: string[] = [];
  
  for (let i = 0; i < words.length; i += wordsPerPage) {
    pages.push(words.slice(i, i + wordsPerPage).join(" "));
  }
  
  return pages.length > 0 ? pages : [""];
}

export function InteractiveBook({ title, subtitle, author, chapters, onClose }: InteractiveBookProps) {
  const [currentSpread, setCurrentSpread] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev" | null>(null);

  // Generate all pages from story data
  const pages = useMemo(() => {
    const allPages: BookPage[] = [];
    let pageNum = 1;

    // Cover page
    allPages.push({ type: "cover", title, subtitle, author });

    // Title page
    allPages.push({ type: "title", title, subtitle, author, pageNumber: pageNum++ });

    // Table of Contents
    allPages.push({ 
      type: "toc", 
      title: "Table of Contents",
      content: chapters.map((ch, i) => `Chapter ${i + 1}: ${ch.title}`).join("\n"),
      pageNumber: pageNum++
    });

    // Chapters
    chapters.forEach((chapter, chapterIndex) => {
      // Chapter start page
      allPages.push({
        type: "chapter-start",
        title: chapter.title,
        chapterNumber: chapterIndex + 1,
        pageNumber: pageNum++
      });

      // Content pages
      const contentPages = splitContentIntoPages(chapter.content || "", WORDS_PER_PAGE);
      contentPages.forEach((content) => {
        allPages.push({
          type: "content",
          content,
          pageNumber: pageNum++
        });
      });

      // Chapter images
      chapter.images?.forEach((img) => {
        allPages.push({
          type: "image",
          imageUrl: img.url,
          imageCaption: img.caption,
          pageNumber: pageNum++
        });
      });
    });

    // Back cover
    allPages.push({ type: "back-cover" });

    return allPages;
  }, [title, subtitle, author, chapters]);

  // Calculate spreads (pairs of pages)
  const totalSpreads = Math.ceil(pages.length / 2);

  const goToNextSpread = () => {
    if (currentSpread < totalSpreads - 1 && !isFlipping) {
      setFlipDirection("next");
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentSpread(prev => prev + 1);
        setIsFlipping(false);
        setFlipDirection(null);
      }, 600);
    }
  };

  const goToPrevSpread = () => {
    if (currentSpread > 0 && !isFlipping) {
      setFlipDirection("prev");
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentSpread(prev => prev - 1);
        setIsFlipping(false);
        setFlipDirection(null);
      }, 600);
    }
  };

  const leftPageIndex = currentSpread * 2;
  const rightPageIndex = currentSpread * 2 + 1;
  const leftPage = pages[leftPageIndex];
  const rightPage = pages[rightPageIndex];

  const renderPage = (page: BookPage | undefined, side: "left" | "right") => {
    if (!page) {
      return <div className="w-full h-full bg-amber-50" />;
    }

    const baseStyles = "w-full h-full flex flex-col p-6 md:p-10 overflow-hidden";
    const textStyles = "font-serif text-foreground";

    switch (page.type) {
      case "cover":
        return (
          <div className={cn(baseStyles, "bg-gradient-to-br from-amber-900 to-amber-950 justify-center items-center text-center")}>
            <div className="space-y-6">
              <h1 className="text-2xl md:text-4xl font-bold text-amber-100 leading-tight">
                {page.title}
              </h1>
              {page.subtitle && (
                <p className="text-lg md:text-xl text-amber-200/80 italic">
                  {page.subtitle}
                </p>
              )}
              <div className="w-16 h-0.5 bg-amber-400/50 mx-auto" />
              {page.author && (
                <p className="text-base md:text-lg text-amber-200">
                  {page.author}
                </p>
              )}
            </div>
          </div>
        );

      case "title":
        return (
          <div className={cn(baseStyles, "bg-amber-50 justify-center items-center text-center")}>
            <div className="space-y-8">
              <h1 className={cn(textStyles, "text-2xl md:text-3xl font-bold leading-tight")}>
                {page.title}
              </h1>
              {page.subtitle && (
                <p className={cn(textStyles, "text-lg md:text-xl italic text-muted-foreground")}>
                  {page.subtitle}
                </p>
              )}
              <div className="w-20 h-px bg-foreground/30 mx-auto" />
              {page.author && (
                <p className={cn(textStyles, "text-base md:text-lg")}>
                  {page.author}
                </p>
              )}
            </div>
            {page.pageNumber && (
              <span className="absolute bottom-4 text-xs text-muted-foreground">
                {page.pageNumber}
              </span>
            )}
          </div>
        );

      case "toc":
        return (
          <div className={cn(baseStyles, "bg-amber-50")}>
            <h2 className={cn(textStyles, "text-xl md:text-2xl font-bold mb-6 text-center")}>
              {page.title}
            </h2>
            <div className="space-y-3 flex-1">
              {page.content?.split("\n").map((line, i) => (
                <div key={i} className={cn(textStyles, "text-sm md:text-base flex justify-between")}>
                  <span>{line}</span>
                  <span className="text-muted-foreground">•</span>
                </div>
              ))}
            </div>
            {page.pageNumber && (
              <span className="text-xs text-muted-foreground text-center">
                {page.pageNumber}
              </span>
            )}
          </div>
        );

      case "chapter-start":
        return (
          <div className={cn(baseStyles, "bg-amber-50 justify-center items-center text-center")}>
            <div className="space-y-4">
              <span className={cn(textStyles, "text-sm md:text-base text-muted-foreground uppercase tracking-widest")}>
                Chapter {page.chapterNumber}
              </span>
              <h2 className={cn(textStyles, "text-xl md:text-2xl font-bold")}>
                {page.title}
              </h2>
              <div className="w-12 h-px bg-foreground/30 mx-auto" />
            </div>
            {page.pageNumber && (
              <span className="absolute bottom-4 text-xs text-muted-foreground">
                {page.pageNumber}
              </span>
            )}
          </div>
        );

      case "content":
        return (
          <div className={cn(baseStyles, "bg-amber-50")}>
            <div className={cn(textStyles, "text-sm md:text-base leading-relaxed flex-1 overflow-hidden")}>
              {page.content?.split("\n\n").map((paragraph, i) => (
                <p key={i} className="mb-4 indent-6 text-justify">
                  {paragraph}
                </p>
              ))}
            </div>
            {page.pageNumber && (
              <span className={cn(
                "text-xs text-muted-foreground",
                side === "left" ? "text-left" : "text-right"
              )}>
                {page.pageNumber}
              </span>
            )}
          </div>
        );

      case "image":
        return (
          <div className={cn(baseStyles, "bg-amber-50 justify-center items-center")}>
            <div className="w-full max-h-[80%] flex flex-col items-center">
              <img
                src={page.imageUrl}
                alt={page.imageCaption || "Story image"}
                className="max-w-full max-h-full object-contain rounded shadow-md"
              />
              {page.imageCaption && (
                <p className={cn(textStyles, "text-xs md:text-sm italic text-muted-foreground mt-3 text-center")}>
                  {page.imageCaption}
                </p>
              )}
            </div>
            {page.pageNumber && (
              <span className="absolute bottom-4 text-xs text-muted-foreground">
                {page.pageNumber}
              </span>
            )}
          </div>
        );

      case "back-cover":
        return (
          <div className={cn(baseStyles, "bg-gradient-to-br from-amber-900 to-amber-950 justify-center items-center")}>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-400/20 flex items-center justify-center mx-auto">
                <span className="text-2xl">📖</span>
              </div>
              <p className="text-amber-200/60 text-sm">The End</p>
            </div>
          </div>
        );

      default:
        return <div className="w-full h-full bg-amber-50" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      {/* Close button */}
      {onClose && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:bg-white/20"
        >
          Close Book
        </Button>
      )}

      {/* Book container */}
      <div 
        className="relative w-full max-w-5xl aspect-[2/1.4] perspective-[2000px]"
        style={{ perspective: "2000px" }}
      >
        {/* Book spine shadow */}
        <div className="absolute left-1/2 top-0 bottom-0 w-4 -translate-x-1/2 bg-gradient-to-r from-black/30 via-black/10 to-black/30 z-10" />

        {/* Left page */}
        <div 
          className={cn(
            "absolute left-0 top-0 w-1/2 h-full bg-amber-50 shadow-xl overflow-hidden",
            "origin-right transition-transform duration-600",
            isFlipping && flipDirection === "prev" && "animate-flip-left"
          )}
          style={{
            transformStyle: "preserve-3d",
            boxShadow: "inset -10px 0 30px rgba(0,0,0,0.1)",
          }}
        >
          <div className="relative w-full h-full">
            {renderPage(leftPage, "left")}
          </div>
        </div>

        {/* Right page */}
        <div 
          className={cn(
            "absolute right-0 top-0 w-1/2 h-full bg-amber-50 shadow-xl overflow-hidden",
            "origin-left transition-transform duration-600",
            isFlipping && flipDirection === "next" && "animate-flip-right"
          )}
          style={{
            transformStyle: "preserve-3d",
            boxShadow: "inset 10px 0 30px rgba(0,0,0,0.1)",
          }}
        >
          <div className="relative w-full h-full">
            {renderPage(rightPage, "right")}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-6 mt-6">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPrevSpread}
          disabled={currentSpread === 0 || isFlipping}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <span className="text-white/80 text-sm min-w-[100px] text-center">
          {currentSpread + 1} / {totalSpreads}
        </span>
        
        <Button
          variant="outline"
          size="icon"
          onClick={goToNextSpread}
          disabled={currentSpread >= totalSpreads - 1 || isFlipping}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Keyboard navigation hint */}
      <p className="text-white/40 text-xs mt-4">
        Use arrow keys or click buttons to navigate
      </p>

      {/* Keyboard navigation */}
      <KeyboardNavigation onPrev={goToPrevSpread} onNext={goToNextSpread} />
    </div>
  );
}

// Keyboard navigation hook component
function KeyboardNavigation({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onPrev, onNext]);

  return null;
}
