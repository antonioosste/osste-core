import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, ImageIcon, Trash2, Sparkles, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoryImageUploader } from "@/components/ui/story-image-uploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useChapters } from "@/hooks/useChapters";
import { useSessions } from "@/hooks/useSessions";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useStoryImages } from "@/hooks/useStoryImages";
import { Badge } from "@/components/ui/badge";

export default function ChapterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [chapter, setChapter] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [overallSummary, setOverallSummary] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>();
  const { getChapter, updateChapter } = useChapters();
  const { getSession } = useSessions();
  
  // Use hook for synchronized image management
  const { images: uploadedImages, deleteImage, refetch: refetchImages } = useStoryImages({ 
    sessionId,
    chapterId: id 
  });

  useEffect(() => {
    if (id) {
      getChapter(id).then(async (data: any) => {
        setChapter(data);
        setTitle(data?.title || "");
        setSummary(data?.summary || "");
        setOverallSummary(data?.overall_summary || "");
        setSessionId(data?.session_id || undefined);
        
        // Load session to get story_group_id for back navigation
        if (data?.session_id) {
          const sessionData = await getSession(data.session_id);
          setSession(sessionData);
        }
      });
    }
  }, [id]);
  
  useEffect(() => {
    if (sessionId) {
      refetchImages();
    }
  }, [sessionId]);

  const handleSave = async () => {
    if (!id) return;

    await updateChapter(id, {
      title,
      summary,
      overall_summary: overallSummary,
    });
    
    toast({
      title: "Chapter saved",
      description: "Your changes have been saved successfully.",
    });
  };

  const handleImageUploadSuccess = () => {
    refetchImages();
    toast({
      title: "Images uploaded",
      description: "Image(s) added to session",
    });
  };

  if (!chapter) {
    return (
      <div className="min-h-screen bg-background">
        <Header isAuthenticated={true} />
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate(session?.story_group_id ? `/books/${session.story_group_id}` : '/books')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Book
        </Button>

        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">Chapter Details</h1>
              {chapter.image_hints && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Suggestions
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              View and edit chapter content, manage images
            </p>
          </div>
          {sessionId && (
            <Button onClick={() => navigate(`/session?id=${sessionId}`)}>
              <Edit className="w-4 h-4 mr-2" />
              Continue Recording
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Chapter Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter chapter title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Enter chapter summary"
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="overall">Overall Summary</Label>
              <Textarea
                id="overall"
                value={overallSummary}
                onChange={(e) => setOverallSummary(e.target.value)}
                placeholder="Enter overall summary"
                rows={6}
              />
            </div>

            <div className="flex items-center gap-4">
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate(session?.story_group_id ? `/books/${session.story_group_id}` : '/books')}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Suggested Images
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              These are image ideas suggested by AI based on your chapter content.
            </p>
          </CardHeader>
          <CardContent>
            {chapter.image_hints ? (
              <div className="space-y-3">
                {(Array.isArray(chapter.image_hints) ? chapter.image_hints : [chapter.image_hints]).map((hint: string, idx: number) => (
                  <div 
                    key={idx} 
                    className="p-4 rounded-lg border border-border bg-muted/30 flex items-start gap-3"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <p className="text-sm text-foreground">{hint}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No image suggestions available yet. Complete the chapter recording to generate AI suggestions.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Chapter Images
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Upload images to include in this chapter. They will be stored and available for the book.
            </p>
          </CardHeader>
          <CardContent>
            {sessionId && (
              <StoryImageUploader 
                sessionId={sessionId}
                chapterId={id}
                usage="embedded"
                maxFiles={10}
                maxSizeMB={8}
                onUploadSuccess={handleImageUploadSuccess}
              />
            )}
            
            {uploadedImages.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Chapter Images ({uploadedImages.length})</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {uploadedImages.map((img) => (
                  <div key={img.id} className="relative rounded-lg border border-border overflow-hidden group">
                    <img 
                      src={img.url} 
                      alt={img.file_name}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <p className="text-white text-xs px-2 text-center line-clamp-2 flex-1">
                        {img.file_name}
                      </p>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 w-7 p-0"
                        onClick={() => deleteImage(img.id, img.storage_path)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
