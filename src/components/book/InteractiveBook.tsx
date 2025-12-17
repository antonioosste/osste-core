import { useState, useMemo, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
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

const WORDS_PER_PAGE = 180;

function splitContentIntoPages(content: string, wordsPerPage: number): string[] {
  const words = content.split(/\s+/);
  const pages: string[] = [];
  
  for (let i = 0; i < words.length; i += wordsPerPage) {
    pages.push(words.slice(i, i + wordsPerPage).join(" "));
  }
  
  return pages.length > 0 ? pages : [""];
}

// Random rotation for polaroid effect
function getRandomRotation(seed: number): number {
  return ((seed * 9301 + 49297) % 233280) / 233280 * 6 - 3;
}

export function InteractiveBook({ title, subtitle, author, chapters, onClose }: InteractiveBookProps) {
  const [currentSpread, setCurrentSpread] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev" | null>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number | null>(null);

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
      title: "Contents",
      content: chapters.map((ch, i) => `${i + 1}. ${ch.title}`).join("\n"),
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
      contentPages.forEach((content, contentIndex) => {
        allPages.push({
          type: "content",
          content,
          pageNumber: pageNum++,
          // Mark first content page for drop cap
          chapterNumber: contentIndex === 0 ? chapterIndex + 1 : undefined
        });
      });

      // Chapter images
      chapter.images?.forEach((img, imgIndex) => {
        allPages.push({
          type: "image",
          imageUrl: img.url,
          imageCaption: img.caption,
          pageNumber: pageNum++,
          chapterNumber: imgIndex // Used for rotation seed
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
      }, 800);
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
      }, 800);
    }
  };

  // Swipe/drag handling
  const handleDragStart = (clientX: number) => {
    dragStartX.current = clientX;
  };

  const handleDragEnd = (clientX: number) => {
    if (dragStartX.current === null) return;
    const delta = clientX - dragStartX.current;
    if (delta < -50) goToNextSpread();
    if (delta > 50) goToPrevSpread();
    dragStartX.current = null;
  };

  const leftPageIndex = currentSpread * 2;
  const rightPageIndex = currentSpread * 2 + 1;
  const leftPage = pages[leftPageIndex];
  const rightPage = pages[rightPageIndex];

  const renderPage = (page: BookPage | undefined, side: "left" | "right") => {
    if (!page) {
      return <div className="w-full h-full book-page-paper" />;
    }

    const baseStyles = "w-full h-full flex flex-col overflow-hidden relative";
    const pageContent = "px-8 py-6 md:px-10 md:py-8";

    switch (page.type) {
      case "cover":
        return (
          <div className={cn(baseStyles, "book-cover justify-center items-center text-center")}>
            <div className="space-y-6 px-8">
              <div className="book-cover-ornament">✦</div>
              <h1 className="font-cinzel text-2xl md:text-4xl font-semibold text-[#c5a059] leading-tight tracking-wide">
                {page.title}
              </h1>
              {page.subtitle && (
                <p className="font-cormorant text-lg md:text-xl text-[#c5a059]/70 italic">
                  {page.subtitle}
                </p>
              )}
              <div className="w-24 h-px bg-[#c5a059]/40 mx-auto" />
              {page.author && (
                <p className="font-cinzel text-sm md:text-base text-[#c5a059]/80 tracking-widest uppercase">
                  {page.author}
                </p>
              )}
              <div className="book-cover-ornament">✦</div>
            </div>
          </div>
        );

      case "title":
        return (
          <div className={cn(baseStyles, "book-page-paper justify-center items-center text-center", pageContent)}>
            <div className="space-y-8">
              <div className="text-[#c5a059]/60 text-2xl">✦</div>
              <h1 className="font-cinzel text-2xl md:text-3xl font-medium text-[#2c3e50] leading-tight">
                {page.title}
              </h1>
              {page.subtitle && (
                <p className="font-cormorant text-lg md:text-xl italic text-[#2c3e50]/60">
                  {page.subtitle}
                </p>
              )}
              <div className="w-20 h-px bg-[#2c3e50]/20 mx-auto" />
              {page.author && (
                <p className="font-reenie text-xl md:text-2xl text-[#2c3e50]/70">
                  by {page.author}
                </p>
              )}
            </div>
            {page.pageNumber && (
              <span className={cn(
                "absolute bottom-4 font-cinzel text-xs text-[#2c3e50]/40",
                side === "left" ? "left-8" : "right-8"
              )}>
                {page.pageNumber}
              </span>
            )}
          </div>
        );

      case "toc":
        return (
          <div className={cn(baseStyles, "book-page-paper", pageContent)}>
            <h2 className="font-cinzel text-xl md:text-2xl font-medium text-[#2c3e50] mb-8 text-center tracking-wide">
              {page.title}
            </h2>
            <div className="text-center text-[#c5a059]/60 mb-6">✦</div>
            <div className="space-y-4 flex-1">
              {page.content?.split("\n").map((line, i) => (
                <div key={i} className="font-cormorant text-base md:text-lg text-[#2c3e50]/80 flex items-center justify-between border-b border-dotted border-[#2c3e50]/10 pb-2">
                  <span>{line}</span>
                </div>
              ))}
            </div>
            {page.pageNumber && (
              <span className={cn(
                "absolute bottom-4 font-cinzel text-xs text-[#2c3e50]/40",
                side === "left" ? "left-8" : "right-8"
              )}>
                {page.pageNumber}
              </span>
            )}
          </div>
        );

      case "chapter-start":
        return (
          <div className={cn(baseStyles, "book-page-paper justify-center items-center text-center", pageContent)}>
            <div className="space-y-6">
              <span className="font-cinzel text-sm md:text-base text-[#c5a059] uppercase tracking-[0.3em]">
                Chapter {page.chapterNumber}
              </span>
              <div className="text-[#c5a059]/50 text-xl">✦ ✦ ✦</div>
              <h2 className="font-cinzel text-xl md:text-2xl font-medium text-[#2c3e50]">
                {page.title}
              </h2>
              <div className="w-16 h-px bg-[#2c3e50]/20 mx-auto" />
            </div>
            {page.pageNumber && (
              <span className={cn(
                "absolute bottom-4 font-cinzel text-xs text-[#2c3e50]/40",
                side === "left" ? "left-8" : "right-8"
              )}>
                {page.pageNumber}
              </span>
            )}
          </div>
        );

      case "content":
        const isFirstPageOfChapter = page.chapterNumber !== undefined;
        return (
          <div className={cn(baseStyles, "book-page-paper", pageContent)}>
            <div className="font-cormorant text-base md:text-lg leading-[1.8] flex-1 overflow-hidden text-[#2c3e50]">
              {page.content?.split("\n\n").map((paragraph, i) => (
                <p key={i} className="mb-5 text-justify hyphens-auto">
                  {isFirstPageOfChapter && i === 0 ? (
                    <>
                      <span className="font-cinzel text-4xl md:text-5xl float-left mr-2 mt-1 leading-none text-[#c5a059]">
                        {paragraph.charAt(0)}
                      </span>
                      {paragraph.slice(1)}
                    </>
                  ) : (
                    paragraph
                  )}
                </p>
              ))}
            </div>
            {page.pageNumber && (
              <span className={cn(
                "absolute bottom-4 font-cinzel text-xs text-[#2c3e50]/40",
                side === "left" ? "left-8" : "right-8"
              )}>
                {page.pageNumber}
              </span>
            )}
          </div>
        );

      case "image":
        const rotation = getRandomRotation(page.chapterNumber || 0);
        return (
          <div className={cn(baseStyles, "book-page-paper justify-center items-center", pageContent)}>
            <div 
              className="polaroid-frame"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <img
                src={page.imageUrl}
                alt={page.imageCaption || "Story memory"}
                className="w-full aspect-[4/3] object-cover"
              />
              {page.imageCaption && (
                <p className="font-reenie text-lg md:text-xl text-[#2c3e50]/80 text-center mt-3 px-2">
                  {page.imageCaption}
                </p>
              )}
            </div>
            {page.pageNumber && (
              <span className={cn(
                "absolute bottom-4 font-cinzel text-xs text-[#2c3e50]/40",
                side === "left" ? "left-8" : "right-8"
              )}>
                {page.pageNumber}
              </span>
            )}
          </div>
        );

      case "back-cover":
        return (
          <div className={cn(baseStyles, "book-cover justify-center items-center")}>
            <div className="text-center space-y-6">
              <div className="text-[#c5a059]/40 text-2xl">✦ ✦ ✦</div>
              <p className="font-reenie text-2xl md:text-3xl text-[#c5a059]/70">The End</p>
              <div className="text-[#c5a059]/40 text-2xl">✦</div>
            </div>
          </div>
        );

      default:
        return <div className="w-full h-full book-page-paper" />;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 book-ambient-bg flex flex-col items-center justify-center p-4"
      onMouseDown={(e) => handleDragStart(e.clientX)}
      onMouseUp={(e) => handleDragEnd(e.clientX)}
      onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
      onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientX)}
    >
      {/* Close button */}
      {onClose && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 font-cinzel text-sm gap-2"
        >
          <X className="h-4 w-4" />
          Close
        </Button>
      )}

      {/* SVG Filter for paper texture */}
      <svg className="absolute w-0 h-0">
        <filter id="paper-texture">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
          <feDiffuseLighting in="noise" lightingColor="#fdfbf7" surfaceScale="2">
            <feDistantLight azimuth="45" elevation="60" />
          </feDiffuseLighting>
        </filter>
      </svg>

      {/* Book container */}
      <div 
        ref={bookRef}
        className="relative w-full max-w-5xl aspect-[2/1.4] select-none"
        style={{ perspective: "2000px" }}
      >
        {/* Book spine shadow */}
        <div className="absolute left-1/2 top-0 bottom-0 w-6 -translate-x-1/2 bg-gradient-to-r from-black/40 via-black/5 to-black/40 z-20 pointer-events-none" />

        {/* Left page */}
        <div 
          className={cn(
            "absolute left-0 top-0 w-1/2 h-full overflow-hidden rounded-l-sm",
            "origin-right",
            isFlipping && flipDirection === "prev" && "book-flip-left"
          )}
          style={{
            transformStyle: "preserve-3d",
            boxShadow: "inset -15px 0 40px rgba(0,0,0,0.15), -2px 0 8px rgba(0,0,0,0.1)",
            transition: "transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1)"
          }}
        >
          <div className="relative w-full h-full">
            {renderPage(leftPage, "left")}
          </div>
        </div>

        {/* Right page */}
        <div 
          className={cn(
            "absolute right-0 top-0 w-1/2 h-full overflow-hidden rounded-r-sm",
            "origin-left",
            isFlipping && flipDirection === "next" && "book-flip-right"
          )}
          style={{
            transformStyle: "preserve-3d",
            boxShadow: "inset 15px 0 40px rgba(0,0,0,0.15), 2px 0 8px rgba(0,0,0,0.1)",
            transition: "transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1)"
          }}
        >
          <div className="relative w-full h-full">
            {renderPage(rightPage, "right")}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-8 mt-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevSpread}
          disabled={currentSpread === 0 || isFlipping}
          className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-20 transition-all"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        
        <span className="font-cinzel text-white/60 text-sm min-w-[100px] text-center tracking-wider">
          {currentSpread + 1} of {totalSpreads}
        </span>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextSpread}
          disabled={currentSpread >= totalSpreads - 1 || isFlipping}
          className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-20 transition-all"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Navigation hint */}
      <p className="font-cormorant text-white/30 text-sm mt-4 italic">
        Swipe or use arrow keys to turn pages
      </p>

      {/* Keyboard navigation */}
      <KeyboardNavigation onPrev={goToPrevSpread} onNext={goToNextSpread} />
    </div>
  );
}

// Keyboard navigation component
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
