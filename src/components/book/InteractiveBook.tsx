import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
  const [currentPage, setCurrentPage] = useState(0);
  const [flippedPages, setFlippedPages] = useState<Set<number>>(new Set());
  const [animatingPage, setAnimatingPage] = useState<number | null>(null);
  const [pageZIndexes, setPageZIndexes] = useState<Record<number, number>>({});
  const bookRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number | null>(null);

  // Generate all pages from story data
  const pages = useMemo(() => {
    const allPages: BookPage[] = [];
    let pageNum = 0;

    // Cover page
    allPages.push({ type: "cover", title, subtitle, author });

    // Title page
    allPages.push({ type: "title", title, subtitle, author, pageNumber: ++pageNum });

    // Table of Contents
    allPages.push({ 
      type: "toc", 
      title: "Contents",
      content: chapters.map((ch, i) => `${i + 1}. ${ch.title}`).join("\n"),
      pageNumber: ++pageNum
    });

    // Chapters
    chapters.forEach((chapter, chapterIndex) => {
      // Chapter start page
      allPages.push({
        type: "chapter-start",
        title: chapter.title,
        chapterNumber: chapterIndex + 1,
        pageNumber: ++pageNum
      });

      // Content pages
      const contentPages = splitContentIntoPages(chapter.content || "", WORDS_PER_PAGE);
      contentPages.forEach((content, contentIndex) => {
        allPages.push({
          type: "content",
          content,
          pageNumber: ++pageNum,
          chapterNumber: contentIndex === 0 ? chapterIndex + 1 : undefined
        });
      });

      // Chapter images
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

    // Back cover
    allPages.push({ type: "back-cover" });

    return allPages;
  }, [title, subtitle, author, chapters]);

  // Create paper sheets (each paper has front and back)
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

  // Initialize z-indexes
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
      
      // Bring to front immediately
      setPageZIndexes(prev => ({ ...prev, [pageIndex]: 100 }));
      setAnimatingPage(pageIndex);
      setFlippedPages(prev => new Set([...prev, pageIndex]));
      
      // After animation, settle z-index
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
      
      // Bring to front immediately
      setPageZIndexes(prev => ({ ...prev, [pageIndex]: 100 }));
      setAnimatingPage(pageIndex);
      setFlippedPages(prev => {
        const newSet = new Set(prev);
        newSet.delete(pageIndex);
        return newSet;
      });
      
      // After animation, restore z-index
      setTimeout(() => {
        setPageZIndexes(prev => ({ ...prev, [pageIndex]: numPapers - pageIndex }));
        setAnimatingPage(null);
        setCurrentPage(prev => prev - 1);
      }, 800);
    }
  }, [currentPage, numPapers, animatingPage]);

  // Swipe handling
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
    const pageContent = "px-6 py-5 md:px-8 md:py-6";
    const pageSide = side === "front" ? "right" : "left";

    switch (page.type) {
      case "cover":
        return (
          <div className={cn(baseStyles, "book-cover justify-center items-center text-center")}>
            <div className="space-y-6 px-6">
              <div className="book-cover-ornament">✦</div>
              <h1 className="font-cinzel text-xl md:text-3xl lg:text-4xl font-semibold text-[#c5a059] leading-tight tracking-wide">
                {page.title}
              </h1>
              {page.subtitle && (
                <p className="font-cormorant text-base md:text-lg lg:text-xl text-[#c5a059]/70 italic">
                  {page.subtitle}
                </p>
              )}
              <div className="w-20 h-px bg-[#c5a059]/40 mx-auto" />
              {page.author && (
                <p className="font-cinzel text-xs md:text-sm text-[#c5a059]/80 tracking-widest uppercase">
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
            <div className="space-y-6">
              <div className="text-[#c5a059]/60 text-xl">✦</div>
              <h1 className="font-cinzel text-xl md:text-2xl lg:text-3xl font-medium text-[#2c3e50] leading-tight">
                {page.title}
              </h1>
              {page.subtitle && (
                <p className="font-cormorant text-base md:text-lg italic text-[#2c3e50]/60">
                  {page.subtitle}
                </p>
              )}
              <div className="w-16 h-px bg-[#2c3e50]/20 mx-auto" />
              {page.author && (
                <p className="font-reenie text-lg md:text-xl text-[#2c3e50]/70">
                  by {page.author}
                </p>
              )}
            </div>
            {page.pageNumber !== undefined && (
              <span className={cn(
                "absolute bottom-3 font-cinzel text-[10px] text-[#2c3e50]/40",
                pageSide === "left" ? "left-6" : "right-6"
              )}>
                {page.pageNumber}
              </span>
            )}
          </div>
        );

      case "toc":
        return (
          <div className={cn(baseStyles, "book-page-paper", pageContent)}>
            <h2 className="font-cinzel text-lg md:text-xl font-medium text-[#2c3e50] mb-6 text-center tracking-wide">
              {page.title}
            </h2>
            <div className="text-center text-[#c5a059]/60 mb-4">✦</div>
            <div className="space-y-3 flex-1 overflow-auto">
              {page.content?.split("\n").map((line, i) => (
                <div key={i} className="font-cormorant text-sm md:text-base text-[#2c3e50]/80 border-b border-dotted border-[#2c3e50]/10 pb-2">
                  {line}
                </div>
              ))}
            </div>
            {page.pageNumber !== undefined && (
              <span className={cn(
                "absolute bottom-3 font-cinzel text-[10px] text-[#2c3e50]/40",
                pageSide === "left" ? "left-6" : "right-6"
              )}>
                {page.pageNumber}
              </span>
            )}
          </div>
        );

      case "chapter-start":
        return (
          <div className={cn(baseStyles, "book-page-paper justify-center items-center text-center", pageContent)}>
            <div className="space-y-5">
              <span className="font-cinzel text-xs md:text-sm text-[#c5a059] uppercase tracking-[0.25em]">
                Chapter {page.chapterNumber}
              </span>
              <div className="text-[#c5a059]/50 text-lg">✦ ✦ ✦</div>
              <h2 className="font-cinzel text-lg md:text-xl font-medium text-[#2c3e50]">
                {page.title}
              </h2>
              <div className="w-12 h-px bg-[#2c3e50]/20 mx-auto" />
            </div>
            {page.pageNumber !== undefined && (
              <span className={cn(
                "absolute bottom-3 font-cinzel text-[10px] text-[#2c3e50]/40",
                pageSide === "left" ? "left-6" : "right-6"
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
            <div className="font-cormorant text-sm md:text-base leading-[1.75] flex-1 overflow-hidden text-[#2c3e50]">
              {page.content?.split("\n\n").map((paragraph, i) => (
                <p key={i} className="mb-4 text-justify hyphens-auto">
                  {isFirstPageOfChapter && i === 0 ? (
                    <>
                      <span className="font-cinzel text-3xl md:text-4xl float-left mr-2 mt-0.5 leading-none text-[#c5a059]">
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
                "absolute bottom-3 font-cinzel text-[10px] text-[#2c3e50]/40",
                pageSide === "left" ? "left-6" : "right-6"
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
              className="polaroid-frame group cursor-pointer"
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
                <p className="font-reenie text-base md:text-lg text-[#2c3e50]/80 text-center mt-2 px-1 transition-colors duration-300 group-hover:text-[#2c3e50]">
                  {page.imageCaption}
                </p>
              )}
            </div>
            {page.pageNumber !== undefined && (
              <span className={cn(
                "absolute bottom-3 font-cinzel text-[10px] text-[#2c3e50]/40",
                pageSide === "left" ? "left-6" : "right-6"
              )}>
                {page.pageNumber}
              </span>
            )}
          </div>
        );

      case "back-cover":
        return (
          <div className={cn(baseStyles, "book-cover justify-center items-center")}>
            <div className="text-center space-y-5">
              <div className="text-[#c5a059]/40 text-xl">✦ ✦ ✦</div>
              <p className="font-reenie text-xl md:text-2xl text-[#c5a059]/70">The End</p>
              <div className="text-[#c5a059]/40 text-xl">✦</div>
            </div>
          </div>
        );

      default:
        return <div className="w-full h-full book-page-paper" />;
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goToNextPage();
      if (e.key === "ArrowLeft") goToPrevPage();
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextPage, goToPrevPage, onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 book-ambient-bg flex flex-col items-center justify-center p-2 md:p-4"
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
          className="absolute top-2 right-2 md:top-4 md:right-4 text-white/80 hover:text-white hover:bg-white/10 font-cinzel text-xs md:text-sm gap-2 z-50"
        >
          <X className="h-4 w-4" />
          <span className="hidden md:inline">Close</span>
        </Button>
      )}

      {/* Book container */}
      <div 
        ref={bookRef}
        className="book-container relative select-none"
        style={{ 
          perspective: "2500px",
          perspectiveOrigin: "center center"
        }}
      >
        <div 
          className="book relative"
          style={{ 
            transformStyle: "preserve-3d",
            width: "var(--book-width)",
            height: "var(--book-height)"
          }}
        >
          {papers.map((paper, index) => {
            const isFlipped = flippedPages.has(index);
            const zIndex = pageZIndexes[index] || (numPapers - index);
            
            return (
              <div
                key={index}
                className="paper absolute top-0 left-0 w-full h-full"
                style={{
                  transformOrigin: "left center",
                  transformStyle: "preserve-3d",
                  transition: "transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1)",
                  transform: isFlipped ? "rotateY(-180deg)" : "rotateY(0deg)",
                  zIndex
                }}
              >
                {/* Front face (right side when open) */}
                <div 
                  className="paper-face front absolute top-0 left-0 w-full h-full overflow-hidden rounded-r-sm"
                  style={{
                    backfaceVisibility: "hidden",
                    boxShadow: "inset 15px 0 40px rgba(0,0,0,0.12), 2px 0 8px rgba(0,0,0,0.08)"
                  }}
                >
                  {renderPageContent(paper.front, "front")}
                </div>
                
                {/* Back face (left side when flipped) */}
                <div 
                  className="paper-face back absolute top-0 left-0 w-full h-full overflow-hidden rounded-l-sm"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    boxShadow: "inset -15px 0 40px rgba(0,0,0,0.12), -2px 0 8px rgba(0,0,0,0.08)"
                  }}
                >
                  {renderPageContent(paper.back, "back")}
                </div>
              </div>
            );
          })}
        </div>

        {/* Book spine */}
        <div 
          className="absolute top-0 h-full w-2 md:w-3 pointer-events-none"
          style={{
            left: "0",
            background: "linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.3) 100%)",
            transform: "translateX(-50%)"
          }}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-6 md:gap-8 mt-6 md:mt-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevPage}
          disabled={currentPage === 0 || animatingPage !== null}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-20 transition-all"
        >
          <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
        </Button>
        
        <span className="font-cinzel text-white/60 text-xs md:text-sm min-w-[80px] md:min-w-[100px] text-center tracking-wider">
          {currentPage + 1} of {numPapers}
        </span>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextPage}
          disabled={currentPage >= numPapers - 1 || animatingPage !== null}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-20 transition-all"
        >
          <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
        </Button>
      </div>

      {/* Navigation hint */}
      <p className="font-cormorant text-white/30 text-xs md:text-sm mt-3 md:mt-4 italic">
        Swipe or use arrow keys to turn pages
      </p>
    </div>
  );
}
