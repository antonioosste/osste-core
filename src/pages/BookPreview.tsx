import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Download, 
  Edit, 
  GripVertical, 
  Settings, 
  FileText,
  BookOpen,
  Calendar,
  User,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Header } from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";
import { useChapters } from "@/hooks/useChapters";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { EmptyState } from "@/components/empty-states/EmptyState";

interface Story {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  order: number;
}

export default function BookPreview() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, user } = useAuth();
  const { profile } = useProfile();
  const { chapters, loading } = useChapters();
  
  const [stories, setStories] = useState<Story[]>([]);
  const [bookDetails, setBookDetails] = useState({
    title: "My Life Stories",
    subtitle: "A Collection of Personal Memories",
    author: "Anonymous",
    year: new Date().getFullYear().toString()
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Convert chapters to stories format
  useEffect(() => {
    if (chapters.length > 0) {
      const convertedStories = chapters.map((chapter, index) => {
        const content = chapter.summary || chapter.overall_summary || 'No content available';
        const wordCount = content.split(/\s+/).length;
        
        return {
          id: chapter.id,
          title: chapter.title || "Untitled Chapter",
          content: content,
          wordCount: wordCount,
          order: chapter.order_index || index + 1
        };
      });
      setStories(convertedStories);
    }
  }, [chapters]);

  // Update author name when profile loads
  useEffect(() => {
    if (profile?.name) {
      setBookDetails(prev => ({ ...prev, author: profile.name || "Anonymous" }));
    }
  }, [profile]);

  const totalWords = stories.reduce((sum, story) => sum + story.wordCount, 0);
  const estimatedPages = Math.ceil(totalWords / 250); // ~250 words per page

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedItem === null) return;

    const newStories = [...stories];
    const draggedStory = newStories[draggedItem];
    
    // Remove from old position
    newStories.splice(draggedItem, 1);
    
    // Insert at new position
    newStories.splice(dropIndex, 0, draggedStory);
    
    // Update order numbers
    const updatedStories = newStories.map((story, index) => ({
      ...story,
      order: index + 1
    }));
    
    setStories(updatedStories);
    setDraggedItem(null);
    
    toast({
      title: "Chapter order updated",
      description: "The chapters have been reordered successfully."
    });
  };

  const generatePDF = async () => {
    if (!session?.access_token) {
      toast({
        title: "Authentication required",
        description: "Please log in to generate PDF.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      if (stories.length === 0) {
        throw new Error("No chapters available to compile.");
      }

      toast({
        title: "Generating PDF...",
        description: "Please wait while we compile your book."
      });

      // Call PDF generation endpoint
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-book-pdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('PDF generation failed');
      }

      const result = await response.json();
      
      toast({
        title: "PDF Generation Ready",
        description: "Your book structure is ready. Integrate a PDF library to download.",
      });
      
      console.log('Book data for PDF:', result.bookData);
      
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error?.message ?? "Something went wrong generating the book.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getPageNumber = (storyIndex: number) => {
    // Title page = 1, TOC = 2, stories start at page 3
    let page = 3;
    for (let i = 0; i < storyIndex; i++) {
      page += Math.ceil(stories[i].wordCount / 250);
    }
    return page;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header isAuthenticated={true} />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading chapters...</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (chapters.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header isAuthenticated={true} />
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" asChild className="mb-8">
            <Link to="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <EmptyState
            icon={BookOpen}
            title="No Chapters Yet"
            description="You don't have any chapters yet. Start a voice session to create your first chapter."
            action={{
              label: "Start Recording",
              onClick: () => navigate("/session")
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Book Preview</h1>
              <p className="text-muted-foreground">
                6×9 format • {estimatedPages} pages • {totalWords} words
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Edit className="w-4 h-4" />
                  Edit Details
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Book Details</DialogTitle>
                  <DialogDescription>
                    Customize your book's title page information
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Book Title</Label>
                    <Input
                      id="title"
                      value={bookDetails.title}
                      onChange={(e) => setBookDetails(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="subtitle">Subtitle</Label>
                    <Input
                      id="subtitle"
                      value={bookDetails.subtitle}
                      onChange={(e) => setBookDetails(prev => ({ ...prev, subtitle: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="author">Author</Label>
                    <Input
                      id="author"
                      value={bookDetails.author}
                      onChange={(e) => setBookDetails(prev => ({ ...prev, author: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      value={bookDetails.year}
                      onChange={(e) => setBookDetails(prev => ({ ...prev, year: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setShowDetailsDialog(false)}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button onClick={generatePDF} disabled={isGenerating} className="gap-2">
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Generate PDF
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Chapter Order Panel */}
          <div className="lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GripVertical className="w-5 h-5" />
                  Chapter Order
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Drag to reorder chapters
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {stories.map((story, index) => (
                  <div
                    key={story.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className="flex items-center gap-3 p-3 bg-muted rounded-lg cursor-move hover:bg-muted/80 transition-colors"
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{story.order}. {story.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {story.wordCount} words • Page {getPageNumber(index)}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Book Preview */}
          <div className="lg:col-span-8">
            <div className="bg-white shadow-2xl mx-auto" style={{ 
              width: '480px', 
              aspectRatio: '6/9',
              fontFamily: 'Crimson Text, Georgia, serif'
            }}>
              {/* Title Page */}
              <div className="h-full p-12 flex flex-col justify-center items-center text-center border-b border-gray-200">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h1 className="text-3xl font-serif font-semibold text-gray-900 leading-tight">
                      {bookDetails.title}
                    </h1>
                    <h2 className="text-lg font-serif italic text-gray-700">
                      {bookDetails.subtitle}
                    </h2>
                  </div>
                  
                  <div className="w-24 h-px bg-gray-400 mx-auto"></div>
                  
                  <div className="space-y-2">
                    <p className="text-base font-serif text-gray-800">
                      {bookDetails.author}
                    </p>
                    <p className="text-sm font-serif text-gray-600">
                      {bookDetails.year}
                    </p>
                  </div>
                </div>
                
                <div className="absolute bottom-8 text-xs text-gray-500">
                  Page 1
                </div>
              </div>
            </div>

            {/* Table of Contents Preview */}
            <div className="bg-white shadow-2xl mx-auto mt-6" style={{ 
              width: '480px', 
              aspectRatio: '6/9',
              fontFamily: 'Crimson Text, Georgia, serif'
            }}>
              <div className="h-full p-12">
                <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-8 text-center">
                  Table of Contents
                </h2>
                
                <div className="space-y-4">
                  {stories.map((story, index) => (
                    <div key={story.id} className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-serif text-base text-gray-900">
                          Chapter {story.order}: {story.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <div className="border-b border-dotted border-gray-400 flex-1 min-w-[20px]"></div>
                        <span className="text-sm text-gray-600 font-serif">
                          {getPageNumber(index)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="absolute bottom-8 text-xs text-gray-500">
                  Page 2
                </div>
              </div>
            </div>

            {/* Sample Chapter Preview */}
            {stories.length > 0 && (
              <div className="bg-white shadow-2xl mx-auto mt-6" style={{ 
                width: '480px', 
                aspectRatio: '6/9',
                fontFamily: 'Crimson Text, Georgia, serif'
              }}>
                <div className="h-full p-12">
                  <h2 className="text-xl font-serif font-semibold text-gray-900 mb-8 text-center">
                    Chapter 1
                  </h2>
                  
                  <h3 className="text-lg font-serif font-semibold text-gray-900 mb-6 text-center">
                    {stories[0]?.title}
                  </h3>
                  
                  <div className="space-y-4 text-sm leading-relaxed text-gray-800 font-serif">
                    {stories[0]?.content.split('\n\n').slice(0, 3).map((paragraph, index) => (
                      <p key={index} className="indent-8">
                        {paragraph}
                      </p>
                    ))}
                    <p className="text-center text-gray-500 italic">
                      ...continued
                    </p>
                  </div>
                  
                  <div className="absolute bottom-8 text-xs text-gray-500">
                    Page 3
                  </div>
                </div>
              </div>
            )}

            <div className="text-center mt-6 text-sm text-muted-foreground">
              This is a preview of your book layout. The final PDF will include all chapters.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}