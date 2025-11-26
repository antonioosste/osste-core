import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoryImageUploader, UploadedImage } from "@/components/ui/story-image-uploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useChapters } from "@/hooks/useChapters";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export default function ChapterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [overallSummary, setOverallSummary] = useState("");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const { getChapter, updateChapter } = useChapters();

  useEffect(() => {
    if (id) {
      getChapter(id).then((data: any) => {
        setChapter(data);
        setTitle(data?.title || "");
        setSummary(data?.summary || "");
        setOverallSummary(data?.overall_summary || "");
      });
      loadExistingImages();
    }
  }, [id]);
  
  const loadExistingImages = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('story_images')
        .select('*')
        .eq('chapter_id', id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const images: UploadedImage[] = data.map(img => ({
          id: img.id,
          file_name: img.file_name,
          url: supabase.storage.from('story-images').getPublicUrl(img.storage_path).data.publicUrl,
          width: img.width || undefined,
          height: img.height || undefined,
          usage: img.usage || 'embedded'
        }));
        setUploadedImages(images);
      }
    } catch (error) {
      console.error('Error loading existing images:', error);
    }
  };

  const handleSave = async () => {
    if (!id) return;

    await updateChapter(id, {
      title,
      summary,
      overall_summary: overallSummary,
    });
  };

  const handleImageUploadSuccess = (images: UploadedImage[]) => {
    setUploadedImages(prev => [...prev, ...images]);
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
        <Button variant="ghost" asChild className="mb-6">
          <Link to={`/recordings/${chapter.recording_id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Recording
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Edit Chapter</h1>
          <p className="text-muted-foreground">
            Update the chapter title and summaries
          </p>
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
              <Button variant="outline" asChild>
                <Link to={`/recordings/${chapter.recording_id}`}>Cancel</Link>
              </Button>
            </div>
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
            <StoryImageUploader 
              sessionId={chapter.session_id}
              chapterId={chapter.id}
              usage="embedded"
              maxFiles={10}
              maxSizeMB={8}
              onUploadSuccess={handleImageUploadSuccess}
            />
            
            {uploadedImages.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Uploaded Images ({uploadedImages.length})</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {uploadedImages.map((img) => (
                    <div key={img.id} className="relative rounded-lg border border-border overflow-hidden">
                      <img 
                        src={img.url} 
                        alt={img.file_name}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="p-2 bg-background/95">
                        <p className="text-xs line-clamp-1">{img.file_name}</p>
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
