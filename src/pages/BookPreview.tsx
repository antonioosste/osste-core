import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { InteractiveBook } from "@/components/book/InteractiveBook";
import { BookEmptyState } from "@/components/book/BookEmptyState";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { generateBookPDF, listStoryImages } from "@/lib/backend-api";
import { Skeleton } from "@/components/ui/skeleton";

interface StoryData {
  id: string;
  title: string | null;
  raw_text: string | null;
  edited_text: string | null;
  approved: boolean | null;
  story_group_id: string | null;
}

interface ChapterData {
  id: string;
  title: string | null;
  polished_text: string | null;
  order_index: number | null;
  session_id: string | null;
}

interface StoryImage {
  id: string;
  url: string;
  caption?: string | null;
  chapter_id?: string | null;
  story_id?: string | null;
}

export default function BookPreview() {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();
  
  const [story, setStory] = useState<StoryData | null>(null);
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [images, setImages] = useState<StoryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [storyGroupTitle, setStoryGroupTitle] = useState<string>("");

  // Fetch story and related data
  useEffect(() => {
    async function fetchData() {
      if (!storyId || !session?.access_token) {
        setLoading(false);
        return;
      }

      try {
        // Fetch story
        const { data: storyData, error: storyError } = await supabase
          .from("stories")
          .select("*")
          .eq("id", storyId)
          .single();

        if (storyError) throw storyError;
        setStory(storyData);

        if (!storyData?.approved) {
          setLoading(false);
          return;
        }

        // Fetch story group for title
        if (storyData.story_group_id) {
          const { data: groupData } = await supabase
            .from("story_groups")
            .select("title")
            .eq("id", storyData.story_group_id)
            .single();
          
          if (groupData) {
            setStoryGroupTitle(groupData.title);
          }

          // Fetch sessions for this story group
          const { data: sessions } = await supabase
            .from("sessions")
            .select("id")
            .eq("story_group_id", storyData.story_group_id);

          if (sessions && sessions.length > 0) {
            const sessionIds = sessions.map(s => s.id);

            // Fetch chapters from all sessions
            const { data: chaptersData, error: chaptersError } = await supabase
              .from("chapters")
              .select("*")
              .in("session_id", sessionIds)
              .order("order_index", { ascending: true });

            if (!chaptersError && chaptersData) {
              setChapters(chaptersData);
            }

            // Fetch images via backend API
            try {
              const allImages: StoryImage[] = [];
              for (const sessionId of sessionIds) {
                const sessionImages = await listStoryImages(session.access_token, {
                  sessionId,
                });
                allImages.push(...sessionImages.map(img => ({
                  id: img.id,
                  url: img.url,
                  caption: img.caption,
                  chapter_id: img.chapter_id,
                  story_id: img.story_id,
                })));
              }
              setImages(allImages);
            } catch (imgError) {
              console.error("Error fetching images:", imgError);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching story data:", error);
        toast({
          title: "Error",
          description: "Failed to load story data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [storyId, session?.access_token, toast]);

  // Handle PDF download via backend API
  const handleDownloadPDF = async () => {
    if (!storyId || !session?.access_token) return;

    setIsDownloading(true);
    try {
      const result = await generateBookPDF(session.access_token, storyId);
      
      if (result.pdfUrl) {
        // Download the PDF
        const link = document.createElement("a");
        link.href = result.pdfUrl;
        link.download = `${storyGroupTitle || "book"}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Download Started",
          description: "Your printable book PDF is downloading.",
        });
      } else {
        toast({
          title: "PDF Queued",
          description: `Your PDF is being generated (Job ID: ${result.jobId}). You'll be notified when it's ready.`,
        });
      }
    } catch (error: any) {
      console.error("PDF download error:", error);
      toast({
        title: "Download Failed",
        description: error?.message || "Could not generate the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Convert chapters to book format
  const bookChapters = chapters.map((chapter, index) => {
    const chapterImages = images
      .filter(img => img.chapter_id === chapter.id)
      .map(img => ({ url: img.url, caption: img.caption || undefined }));

    return {
      title: chapter.title || `Chapter ${index + 1}`,
      content: chapter.polished_text || "",
      images: chapterImages,
    };
  });

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header isAuthenticated={true} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-32" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="flex justify-center">
            <Skeleton className="w-80 h-[480px] rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Story not found or not approved
  if (!story || !story.approved) {
    return (
      <div className="min-h-screen bg-background">
        <Header isAuthenticated={true} />
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/stories">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Stories
            </Link>
          </Button>
          <BookEmptyState 
            message="This story is not available for preview yet. Please ensure the story has been approved before viewing."
            backLink="/stories"
            backLabel="Back to Stories"
          />
        </div>
      </div>
    );
  }

  // Get story content for fallback display
  const storyContent = story.edited_text || story.raw_text || "";
  const wordCount = storyContent.split(/\s+/).filter(Boolean).length;
  const estimatedPages = Math.max(1, Math.ceil(wordCount / 250));

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to={story.story_group_id ? `/books/${story.story_group_id}` : "/stories"}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Book
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {storyGroupTitle || story.title || "Book Preview"}
              </h1>
              <p className="text-muted-foreground">
                {chapters.length} chapters • ~{estimatedPages} pages • {wordCount.toLocaleString()} words
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center gap-8">
          {/* Book Cover Preview */}
          <div 
            className="relative w-80 cursor-pointer group"
            onClick={() => setIsBookOpen(true)}
          >
            <div 
              className="w-full aspect-[6/9] bg-gradient-to-br from-amber-900 to-amber-950 rounded-r-lg shadow-2xl flex flex-col justify-center items-center text-center p-8 transition-transform group-hover:scale-[1.02]"
              style={{
                boxShadow: "-4px 0 8px rgba(0,0,0,0.2), 0 10px 30px rgba(0,0,0,0.3)",
              }}
            >
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-amber-100 leading-tight font-serif">
                  {storyGroupTitle || story.title}
                </h2>
                <div className="w-12 h-0.5 bg-amber-400/50 mx-auto" />
                <p className="text-sm text-amber-200/70">
                  A collection of memories
                </p>
              </div>
            </div>
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 rounded-r-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="text-white text-center">
                <BookOpen className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm font-medium">Click to Read</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button 
              size="lg" 
              onClick={() => setIsBookOpen(true)}
              className="gap-2"
            >
              <BookOpen className="w-5 h-5" />
              Read Interactive
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="gap-2"
            >
              {isDownloading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              {isDownloading ? "Generating..." : "Download Printable Book"}
            </Button>
          </div>

          {/* Chapter List */}
          {chapters.length > 0 && (
            <div className="w-full max-w-2xl mt-8">
              <h3 className="text-lg font-semibold mb-4">Table of Contents</h3>
              <div className="space-y-2">
                {chapters.map((chapter, index) => (
                  <div 
                    key={chapter.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <span className="font-medium">
                      Chapter {index + 1}: {chapter.title || "Untitled"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {chapter.polished_text?.split(/\s+/).filter(Boolean).length || 0} words
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Book Modal */}
      {isBookOpen && (
        <InteractiveBook
          title={storyGroupTitle || story.title || "My Book"}
          subtitle="A collection of memories"
          author=""
          chapters={bookChapters}
          onClose={() => setIsBookOpen(false)}
        />
      )}
    </div>
  );
}
