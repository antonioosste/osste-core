import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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

function getRandomRotation(seed: number): number {
  return ((seed * 9301 + 49297) % 233280) / 233280 * 6 - 3;
}

export function InteractiveBook({ title, subtitle, author, chapters, onClose }: InteractiveBookProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [flippedPages, setFlippedPages] = useState<Set<number>>(new Set());
  const [animatingPage, setAnimatingPage] = useState<number | null>(null);
  const [pageZIndexes, setPageZIndexes] = useState<Record<number, number>>({});
  const [isBookOpen, setIsBookOpen] = useState(false);
  const bookRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number | null>(null);

  // Trigger book opening animation
  useEffect(() => {
    const timer = setTimeout(() => setIsBookOpen(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Generate all pages from story data
  const pages = useMemo(() => {
    const allPages: BookPage[] = [];
    let pageNum = 0;

    allPages.push({ type: "cover", title, subtitle, author });
    allPages.push({ type: "title", title, subtitle, author, pageNumber: ++pageNum });
    allPages.push({ 
      type: "toc", 
      title: "Contents",
      content: chapters.map((ch, i) => `${i + 1}. ${ch.title}`).join("\n"),
      pageNumber: ++pageNum
    });

    chapters.forEach((chapter, chapterIndex) => {
      allPages.push({
        type: "chapter-start",
        title: chapter.title,
        chapterNumber: chapterIndex + 1,
        pageNumber: ++pageNum
      });

      const contentPages = splitContentIntoPages(chapter.content || "", WORDS_PER_PAGE);
      contentPages.forEach((content, contentIndex) => {
        allPages.push({
          type: "content",
          content,
          pageNumber: ++pageNum,
          chapterNumber: contentIndex === 0 ? chapterIndex + 1 : undefined
        });
      });

      chapter.images?.forEach((img, imgIndex) => {
        allPages.push({
          type: "image",
          imageUrl: img.url,
          imageCaption: img.caption,
          pageNumber: ++pageNum,
          chapterNumber: imgIndex
        });
      });
    });

    allPages.push({ type: "back-cover" });
    return allPages;
  }, [title, subtitle, author, chapters]);

  const papers = useMemo(() => {
    const result: { front: BookPage; back: BookPage | null }[] = [];
    for (let i = 0; i < pages.length; i += 2) {
      result.push({
        front: pages[i],
        back: pages[i + 1] || null
      });
    }
    return result;
  }, [pages]);

  const numPapers = papers.length;

  useEffect(() => {
    const initialZIndexes: Record<number, number> = {};
    papers.forEach((_, index) => {
      initialZIndexes[index] = numPapers - index;
    });
    setPageZIndexes(initialZIndexes);
  }, [papers, numPapers]);

  const goToNextPage = useCallback(() => {
    if (currentPage < numPapers - 1 && animatingPage === null) {
      const pageIndex = currentPage;
      setPageZIndexes(prev => ({ ...prev, [pageIndex]: 100 }));
      setAnimatingPage(pageIndex);
      setFlippedPages(prev => new Set([...prev, pageIndex]));
      
      setTimeout(() => {
        setPageZIndexes(prev => ({ ...prev, [pageIndex]: pageIndex + 1 }));
        setAnimatingPage(null);
        setCurrentPage(prev => prev + 1);
      }, 800);
    }
  }, [currentPage, numPapers, animatingPage]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 0 && animatingPage === null) {
      const pageIndex = currentPage - 1;
      setPageZIndexes(prev => ({ ...prev, [pageIndex]: 100 }));
      setAnimatingPage(pageIndex);
      setFlippedPages(prev => {
        const newSet = new Set(prev);
        newSet.delete(pageIndex);
        return newSet;
      });
      
      setTimeout(() => {
        setPageZIndexes(prev => ({ ...prev, [pageIndex]: numPapers - pageIndex }));
        setAnimatingPage(null);
        setCurrentPage(prev => prev - 1);
      }, 800);
    }
  }, [currentPage, numPapers, animatingPage]);

  const handleDragStart = (clientX: number) => {
    if (animatingPage !== null) return;
    dragStartX.current = clientX;
  };

  const handleDragEnd = (clientX: number) => {
    if (dragStartX.current === null) return;
    const delta = clientX - dragStartX.current;
    if (delta < -60) goToNextPage();
    else if (delta > 60) goToPrevPage();
    dragStartX.current = null;
  };

  const renderPageContent = (page: BookPage | null, side: "front" | "back") => {
    if (!page) {
      return <div className="w-full h-full book-page-paper" />;
    }

    const baseStyles = "w-full h-full flex flex-col overflow-hidden relative";
    const pageContent = "px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6";
    const pageSide = side === "front" ? "right" : "left";

    switch (page.type) {
      case "cover":
        return (
          <div className={cn(baseStyles, "book-cover justify-center items-center text-center")}>
            <div className="book-cover-texture" />
            <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 relative z-10">
              <div className="book-cover-ornament">✦</div>
              <h1 className="font-cinzel text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-[#c5a059] leading-tight tracking-wide">
                {page.title}
              </h1>
              {page.subtitle && (
                <p className="font-cormorant text-sm sm:text-base md:text-lg text-[#c5a059]/70 italic">
                  {page.subtitle}
                </p>
              )}
              <div className="w-16 sm:w-20 h-px bg-[#c5a059]/40 mx-auto" />
              {page.author && (
                <p className="font-cinzel text-[10px] sm:text-xs text-[#c5a059]/80 tracking-widest uppercase">
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
            <div className="book-paper-texture" />
            <div className="space-y-4 sm:space-y-6 relative z-10">
              <div className="text-[#c5a059]/60 text-lg sm:text-xl">✦</div>
              <h1 className="font-cinzel text-base sm:text-xl md:text-2xl font-medium text-[#2c3e50] leading-tight">
                {page.title}
              </h1>
              {page.subtitle && (
                <p className="font-cormorant text-sm sm:text-base italic text-[#2c3e50]/60">
                  {page.subtitle}
                </p>
              )}
              <div className="w-12 sm:w-16 h-px bg-[#2c3e50]/20 mx-auto" />
              {page.author && (
                <p className="font-reenie text-base sm:text-lg md:text-xl text-[#2c3e50]/70">
                  by {page.author}
                </p>
              )}
            </div>
            {page.pageNumber !== undefined && (
              <span className={cn(
                "absolute bottom-2 sm:bottom-3 font-cinzel text-[8px] sm:text-[10px] text-[#2c3e50]/40",
                pageSide === "left" ? "left-4 sm:left-6" : "right-4 sm:right-6"
              )}>
                {page.pageNumber}
              </span>
            )}
          </div>
        );

      case "toc":
        return (
          <div className={cn(baseStyles, "book-page-paper", pageContent)}>
            <div className="book-paper-texture" />
            <div className="relative z-10 flex flex-col h-full">
              <h2 className="font-cinzel text-sm sm:text-lg md:text-xl font-medium text-[#2c3e50] mb-4 sm:mb-6 text-center tracking-wide">
                {page.title}
              </h2>
              <div className="text-center text-[#c5a059]/60 mb-3 sm:mb-4">✦</div>
              <div className="space-y-2 sm:space-y-3 flex-1 overflow-auto">
                {page.content?.split("\n").map((line, i) => (
                  <div key={i} className="font-cormorant text-xs sm:text-sm md:text-base text-[#2c3e50]/80 border-b border-dotted border-[#2c3e50]/10 pb-1 sm:pb-2">
                    {line}
                  </div>
                ))}
              </div>
            </div>
            {page.pageNumber !== undefined && (
              <span className={cn(
                "absolute bottom-2 sm:bottom-3 font-cinzel text-[8px] sm:text-[10px] text-[#2c3e50]/40 z-10",
                pageSide === "left" ? "left-4 sm:left-6" : "right-4 sm:right-6"
              )}>
                {page.pageNumber}
              </span>
            )}
          </div>
        );

      case "chapter-start":
        return (
          <div className={cn(baseStyles, "book-page-paper justify-center items-center text-center", pageContent)}>
            <div className="book-paper-texture" />
            <div className="space-y-3 sm:space-y-5 relative z-10">
              <span className="font-cinzel text-[10px] sm:text-xs text-[#c5a059] uppercase tracking-[0.2em] sm:tracking-[0.25em]">
                Chapter {page.chapterNumber}
              </span>
              <div className="text-[#c5a059]/50 text-base sm:text-lg">✦ ✦ ✦</div>
              <h2 className="font-cinzel text-sm sm:text-lg md:text-xl font-medium text-[#2c3e50]">
                {page.title}
              </h2>
              <div className="w-10 sm:w-12 h-px bg-[#2c3e50]/20 mx-auto" />
            </div>
            {page.pageNumber !== undefined && (
              <span className={cn(
                "absolute bottom-2 sm:bottom-3 font-cinzel text-[8px] sm:text-[10px] text-[#2c3e50]/40 z-10",
                pageSide === "left" ? "left-4 sm:left-6" : "right-4 sm:right-6"
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
            <div className="book-paper-texture" />
            <div className="font-cormorant text-xs sm:text-sm md:text-base leading-[1.6] sm:leading-[1.75] flex-1 overflow-hidden text-[#2c3e50] relative z-10">
              {page.content?.split("\n\n").map((paragraph, i) => (
                <p key={i} className="mb-3 sm:mb-4 text-justify hyphens-auto">
                  {isFirstPageOfChapter && i === 0 ? (
                    <>
                      <span className="font-cinzel text-2xl sm:text-3xl md:text-4xl float-left mr-1 sm:mr-2 mt-0.5 leading-none text-[#c5a059]">
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
            {page.pageNumber !== undefined && (
              <span className={cn(
                "absolute bottom-2 sm:bottom-3 font-cinzel text-[8px] sm:text-[10px] text-[#2c3e50]/40 z-10",
                pageSide === "left" ? "left-4 sm:left-6" : "right-4 sm:right-6"
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
            <div className="book-paper-texture" />
            <div 
              className="polaroid-frame group cursor-pointer relative z-10"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <div className="overflow-hidden">
                <img
                  src={page.imageUrl}
                  alt={page.imageCaption || "Story memory"}
                  className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              {page.imageCaption && (
                <p className="font-reenie text-sm sm:text-base md:text-lg text-[#2c3e50]/80 text-center mt-2 px-1">
                  {page.imageCaption}
                </p>
              )}
            </div>
            {page.pageNumber !== undefined && (
              <span className={cn(
                "absolute bottom-2 sm:bottom-3 font-cinzel text-[8px] sm:text-[10px] text-[#2c3e50]/40 z-10",
                pageSide === "left" ? "left-4 sm:left-6" : "right-4 sm:right-6"
              )}>
                {page.pageNumber}
              </span>
            )}
          </div>
        );

      case "back-cover":
        return (
          <div className={cn(baseStyles, "book-cover justify-center items-center")}>
            <div className="book-cover-texture" />
            <div className="text-center space-y-4 sm:space-y-5 relative z-10">
              <div className="text-[#c5a059]/40 text-lg sm:text-xl">✦ ✦ ✦</div>
              <p className="font-reenie text-lg sm:text-xl md:text-2xl text-[#c5a059]/70">The End</p>
              <div className="text-[#c5a059]/40 text-lg sm:text-xl">✦</div>
            </div>
          </div>
        );

      default:
        return <div className="w-full h-full book-page-paper" />;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goToNextPage();
      if (e.key === "ArrowLeft") goToPrevPage();
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextPage, goToPrevPage, onClose]);

  const progress = ((currentPage + 1) / numPapers) * 100;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 book-ambient-bg flex items-center justify-center overflow-hidden"
        onMouseDown={(e) => handleDragStart(e.clientX)}
        onMouseUp={(e) => handleDragEnd(e.clientX)}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
        onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientX)}
      >
        {/* Ambient lighting effects */}
        <div className="book-ambient-glow" />
        <div className="book-vignette" />

        {/* Close button */}
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white/80 hover:text-white hover:bg-white/10 font-cinzel text-xs gap-2 z-50"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Close</span>
          </Button>
        )}

        {/* Book wrapper for centering and animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, rotateX: 20 }}
          animate={{ 
            scale: isBookOpen ? 1 : 0.8, 
            opacity: isBookOpen ? 1 : 0,
            rotateX: isBookOpen ? 0 : 20
          }}
          transition={{ 
            type: "spring",
            stiffness: 100,
            damping: 20,
            duration: 0.8
          }}
          className="book-wrapper"
        >
          {/* Book container */}
          <div 
            ref={bookRef}
            className="book-container relative select-none group"
          >
            {/* Edge gilding effect (visible page stack) */}
            <div className="book-edge-gilding book-edge-top" />
            <div className="book-edge-gilding book-edge-bottom" />
            <div className="book-edge-gilding book-edge-right" />

            <div 
              className="book relative"
              style={{ 
                transformStyle: "preserve-3d",
                width: "100%",
                height: "100%"
              }}
            >
              {papers.map((paper, index) => {
                const isFlipped = flippedPages.has(index);
                const isAnimating = animatingPage === index;
                const zIndex = pageZIndexes[index] || (numPapers - index);
                
                return (
                  <div
                    key={index}
                    className={cn(
                      "paper absolute top-0 left-0 w-full h-full",
                      isAnimating && "page-flipping"
                    )}
                    style={{
                      transformOrigin: "left center",
                      transformStyle: "preserve-3d",
                      transition: "transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1)",
                      transform: isFlipped ? "rotateY(-180deg)" : "rotateY(0deg)",
                      zIndex
                    }}
                  >
                    {/* Front face */}
                    <div 
                      className="paper-face front absolute top-0 left-0 w-full h-full overflow-hidden rounded-r-sm"
                      style={{
                        backfaceVisibility: "hidden",
                        boxShadow: isAnimating 
                          ? "inset 20px 0 60px rgba(0,0,0,0.2), 4px 0 15px rgba(0,0,0,0.15)"
                          : "inset 12px 0 35px rgba(0,0,0,0.1), 2px 0 6px rgba(0,0,0,0.06)"
                      }}
                    >
                      {renderPageContent(paper.front, "front")}
                    </div>
                    
                    {/* Back face */}
                    <div 
                      className="paper-face back absolute top-0 left-0 w-full h-full overflow-hidden rounded-l-sm"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        boxShadow: isAnimating
                          ? "inset -20px 0 60px rgba(0,0,0,0.2), -4px 0 15px rgba(0,0,0,0.15)"
                          : "inset -12px 0 35px rgba(0,0,0,0.1), -2px 0 6px rgba(0,0,0,0.06)"
                      }}
                    >
                      {renderPageContent(paper.back, "back")}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Book spine */}
            <div className="book-spine" />
          </div>
        </motion.div>

        {/* Navigation & Progress */}
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 sm:gap-4 z-40">
          {/* Progress bar */}
          <div className="w-32 sm:w-48 h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-[#c5a059]/60 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevPage}
              disabled={currentPage === 0 || animatingPage !== null}
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white disabled:opacity-30 backdrop-blur-sm border border-white/10"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
            
            <span className="font-cinzel text-xs sm:text-sm text-white/60 min-w-[60px] sm:min-w-[80px] text-center tabular-nums">
              {currentPage + 1} / {numPapers}
            </span>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextPage}
              disabled={currentPage === numPapers - 1 || animatingPage !== null}
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white disabled:opacity-30 backdrop-blur-sm border border-white/10"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </div>
        </div>

        {/* Swipe hint for mobile */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 sm:hidden">
          <p className="text-white/40 text-[10px] font-cinzel tracking-wider">
            Swipe to turn pages
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
