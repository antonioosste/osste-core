// StoryDetail page - displays story content with images
import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Edit, 
  Share2, 
  Download, 
  Play, 
  Pause, 
  Settings,
  CheckCircle,
  RotateCcw,
  FileText,
  X,
  Image as ImageIcon,
  Trash2,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import ReactMarkdown from "react-markdown";
import { Header } from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";
import { useStories } from "@/hooks/useStories";
import { useStoryGroups } from "@/hooks/useStoryGroups";
import { StoryImageUploader, UploadedImage } from "@/components/ui/story-image-uploader";
import { GeneratingOverlay } from "@/components/loaders/GeneratingOverlay";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { assembleStory } from "@/lib/backend-api";
import { useStoryImages } from "@/hooks/useStoryImages";

const sampleStory = {
  id: "1",
  title: "Childhood Memories in Brooklyn",
  summary: "Growing up in 1950s Brooklyn, with stories of the neighborhood candy store and summer stickball games.",
  polishedContent: `I was born in Brooklyn in 1942, right in the heart of what we called "the neighborhood." Our block was lined with brownstones, each one filled with families who knew each other's business—and I mean that in the best possible way.

The candy store on the corner was owned by Mr. Goldstein, a kind man with thick glasses who always had a smile for us kids. We'd spend our nickels on penny candy, carefully choosing each piece from the glass jars that lined the counter. There were Swedish fish, Mary Janes, and those little wax bottles filled with colored syrup that we'd bite the tops off of.

Summer meant stickball in the street. We'd use a broomstick and a pink rubber ball—what we called a "spaldeen." The manhole covers were our bases, and we'd play until the streetlights came on and our mothers called us in for dinner.

The neighborhood was alive with sounds: kids playing, mothers calling from windows, the knife sharpener's bell, and the ice cream truck playing its tinny melody. Everyone looked out for everyone else's kids. If you misbehaved three blocks from home, your mother would know about it before you got back.

Those were simpler times, but they were rich with community and connection. Every day was an adventure, even if it was just walking to the corner store or playing in the street until dark.`,
  transcript: [
    {
      timestamp: "00:00",
      speaker: "Interviewer",
      text: "Tell me about your earliest childhood memory. What stands out most vividly?"
    },
    {
      timestamp: "00:15",
      speaker: "You",
      text: "Well, I was born in Brooklyn in 1942, and... um... our block was lined with brownstones. Each one filled with families who knew each other's business, and I mean that in the best possible way."
    },
    {
      timestamp: "00:45",
      speaker: "Interviewer", 
      text: "That sounds like a close-knit community. Can you tell me more about the neighborhood?"
    },
    {
      timestamp: "01:02",
      speaker: "You",
      text: "Oh yes! The candy store on the corner was owned by Mr. Goldstein. He was this kind man with thick glasses who always had a smile for us kids. We'd spend our nickels on penny candy..."
    },
    {
      timestamp: "01:35",
      speaker: "You",
      text: "There were Swedish fish, Mary Janes, and those little wax bottles filled with colored syrup. We'd bite the tops off of them, you know?"
    },
    {
      timestamp: "02:15",
      speaker: "Interviewer",
      text: "What did you do for fun in the neighborhood?"
    },
    {
      timestamp: "02:22",
      speaker: "You", 
      text: "Summer meant stickball in the street! We'd use a broomstick and a pink rubber ball - what we called a 'spaldeen.' The manhole covers were our bases."
    },
  ],
  status: "polished",
  date: "2 days ago",
  duration: "32 min",
  wordCount: 342,
  tags: ["childhood", "brooklyn", "1950s"],
  audioUrl: "#", // Mock URL
  entities: {
    people: ["Mr. Goldstein"],
    places: ["Brooklyn", "neighborhood", "candy store", "corner"],
    dates: ["1942", "1950s", "Summer"],
    events: ["stickball games", "penny candy shopping"]
  }
};

export default function StoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getStory, updateStory } = useStories();
  const { storyGroups } = useStoryGroups();
  const [story, setStory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [regenerateDialog, setRegenerateDialog] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [styleInstruction, setStyleInstruction] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Helper to get book title
  const getBookTitle = () => {
    if (!story?.story_group_id) return null;
    const book = storyGroups?.find(g => g.id === story.story_group_id);
    return book?.title || null;
  };

  // Get display title: story.title (if set) -> book.title (fallback) -> "Untitled Story"
  // Per spec: Show placeholder "Untitled Story" when no title exists
  const getDisplayTitle = () => {
    return story?.title || getBookTitle() || "Untitled Story";
  };

  // Check if this is an AI-suggested title (no user edits yet)
  // A title is "suggested" if it exists but came from AI, not user
  const isSuggestedTitle = story?.title && !getBookTitle();
  
  // Use hook for synchronized image management - fetch all images from the story group
  const { images: uploadedImages, deleteImage, refetch: refetchImages } = useStoryImages({ 
    storyId: id,
    storyGroupId: story?.story_group_id,
  });

  useEffect(() => {
    const loadStory = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getStory(id);
        if (data) {
          setStory(data);
          setEditedContent(data.edited_text || data.raw_text || "");
        }
      } catch (error) {
        console.error('Error loading story:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStory();
  }, [id]);
  
  useEffect(() => {
    if (story?.story_group_id) {
      refetchImages();
    }
  }, [story?.story_group_id]);

  const handlePlayAudio = () => {
    setIsPlaying(!isPlaying);
    // Mock audio play/pause
  };

  const handleSaveEdit = async () => {
    if (!id) return;
    
    try {
      await updateStory(id, { edited_text: editedContent });
      setIsEditing(false);
      if (story) {
        setStory({ ...story, edited_text: editedContent });
      }
    } catch (error) {
      console.error('Error saving edit:', error);
    }
  };

  const handleSaveTitle = async () => {
    if (!id || !editedTitle.trim()) return;
    
    try {
      await updateStory(id, { title: editedTitle.trim() });
      setIsEditingTitle(false);
      if (story) {
        setStory({ ...story, title: editedTitle.trim() });
      }
      toast({
        title: "Title updated",
        description: "Story title has been saved."
      });
    } catch (error) {
      console.error('Error saving title:', error);
      toast({
        title: "Error",
        description: "Failed to update title.",
        variant: "destructive"
      });
    }
  };

  const startEditingTitle = () => {
    // Use current story title if set, otherwise empty for new custom title
    setEditedTitle(story?.title || "");
    setIsEditingTitle(true);
  };

  const handleApprove = async () => {
    if (!id) return;
    
    try {
      await updateStory(id, { approved: true });
      if (story) {
        setStory({ ...story, approved: true });
      }
    } catch (error) {
      console.error('Error approving story:', error);
    }
  };

  const handleRegenerate = async () => {
    if (!story?.story_group_id) {
      toast({
        title: "Error",
        description: "Unable to regenerate story - book not found.",
        variant: "destructive"
      });
      return;
    }

    setIsRegenerating(true);
    setRegenerateDialog(false);

    try {
      // Get current auth session
      const { data: { session: authSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !authSession) {
        throw new Error("Authentication required");
      }

      // Fetch a session from this story's book (story_group_id)
      const { data: sessionData, error: fetchError } = await supabase
        .from('sessions')
        .select('id')
        .eq('story_group_id', story.story_group_id)
        .limit(1)
        .single();

      if (fetchError || !sessionData) {
        throw new Error("No chapters found for this book. Add recordings first.");
      }

      toast({
        title: "Regenerating story...",
        description: styleInstruction 
          ? "AI is creating a new version with your style preferences." 
          : "AI is creating a new version based on the transcript."
      });

      // Call backend API with optional style instruction
      const result = await assembleStory(
        authSession.access_token,
        sessionData.id,
        styleInstruction.trim() || null
      );

      // Fetch updated story from database
      const updatedStory = await getStory(id!);
      
      if (updatedStory) {
        // Per spec: On regeneration, only update title if story previously had no title
        // If title already exists (user-edited or previous AI suggestion), preserve it
        const preservedTitle = story?.title;
        
        setStory({ 
          ...updatedStory, 
          title: preservedTitle || updatedStory.title 
        });
        setEditedContent(updatedStory.edited_text || updatedStory.raw_text || "");
        
        // Scroll to top of content
        if (contentRef.current) {
          contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        toast({
          title: "Story regenerated successfully",
          description: "Your story has been updated with the new version."
        });
      }

      setStyleInstruction("");
    } catch (error) {
      console.error('Error regenerating story:', error);
      toast({
        title: "Regeneration failed",
        description: error instanceof Error ? error.message : "Failed to regenerate story. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleImageUploadSuccess = () => {
    refetchImages();
    toast({
      title: "Images uploaded",
      description: "Image(s) added to story",
    });
  };

  const formatTimestamp = (timestamp: string) => {
    return timestamp;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header isAuthenticated={true} />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-background">
        <Header isAuthenticated={true} />
        <div className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">Story not found</p>
        </div>
      </div>
    );
  }

  const displayContent = story.edited_text || story.raw_text || "No content available";

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      
      {/* Story Regeneration Overlay */}
      <GeneratingOverlay 
        isVisible={isRegenerating} 
        type="story" 
        title={getDisplayTitle()}
      />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link to={story?.story_group_id ? `/books/${story.story_group_id}` : '/books'}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Book
            </Link>
          </Button>
        </div>

        {/* Story Header */}
        <div className="mb-8" ref={contentRef}>
          <div className="flex flex-col lg:flex-row items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
              {isEditingTitle ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2">
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    placeholder="Enter story title..."
                    className="text-xl sm:text-2xl font-bold h-12 w-full"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') setIsEditingTitle(false);
                    }}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveTitle}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditingTitle(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-2 group flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">
                    {getDisplayTitle()}
                  </h1>
                  {/* Show "Suggested" badge for AI-generated titles */}
                  {story?.title && !getBookTitle() && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      AI Suggested
                    </Badge>
                  )}
                  {/* Show placeholder indicator for untitled stories */}
                  {!story?.title && !getBookTitle() && (
                    <Badge variant="secondary" className="text-xs">
                      Click to add title
                    </Badge>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={startEditingTitle}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <p className="text-muted-foreground mb-4">
                {displayContent.substring(0, 150)}...
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Badge variant={story.approved ? "default" : "secondary"}>
                  {story.approved ? "approved" : story.edited_text ? "polished" : "draft"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {displayContent.split(' ').length} words • {new Date(story.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              <Button onClick={handleApprove} className="gap-2 flex-1 sm:flex-none min-h-[44px]">
                <CheckCircle className="w-4 h-4" />
                Approve
              </Button>
              {story.approved && (
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/book/preview/${story.id}`)}
                  className="gap-2 flex-1 sm:flex-none min-h-[44px]"
                >
                  <BookOpen className="w-4 h-4" />
                  Preview Book
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => setRegenerateDialog(true)}
                className="gap-2 flex-1 sm:flex-none min-h-[44px]"
                disabled={isRegenerating}
              >
                <RotateCcw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                {isRegenerating ? "Regenerating..." : "Regenerate"}
              </Button>
            </div>
          </div>
        </div>

        {/* Two-Pane Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Pane - Raw Text */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Original Content
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              <div className="prose prose-stone dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                <ReactMarkdown>
                  {story.raw_text || "No original content available"}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          {/* Right Pane - Polished Story */}
          <Card className="h-fit">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Polished Story</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="min-h-[500px] resize-none"
                    placeholder="Edit your story..."
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit}>Save Changes</Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div 
                  className="prose prose-stone dark:prose-invert max-w-none max-h-[600px] overflow-y-auto font-serif"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  <ReactMarkdown>{displayContent}</ReactMarkdown>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Story Images Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Story Images
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Upload images to include with this story. They will be stored and can be included in the final book.
            </p>
          </CardHeader>
          <CardContent>
            <StoryImageUploader 
              storyId={id}
              usage="embedded"
              maxFiles={10}
              maxSizeMB={8}
              onUploadSuccess={handleImageUploadSuccess}
            />
            
            {uploadedImages.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Story Images ({uploadedImages.length})</h4>
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

      </div>

      {/* Regenerate Confirmation Dialog */}
      <Dialog open={regenerateDialog} onOpenChange={setRegenerateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Regenerate Story</DialogTitle>
            <DialogDescription>
              Add a tone or style preference to customize how your story is rewritten, or leave it blank to use the default style.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="style-instruction">Style Instruction (Optional)</Label>
              <Textarea
                id="style-instruction"
                placeholder="Example: 'Make it more emotional', 'Write it like a children's bedtime story', 'Make it more poetic'"
                value={styleInstruction}
                onChange={(e) => setStyleInstruction(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to regenerate with the default style. The AI will recreate the story based on your recordings and chapter summaries.
              </p>
            </div>
            
            <div className="bg-muted/50 p-3 rounded-md border border-border">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Note:</strong> This will create a new version based on your original recordings. Any manual edits will be replaced.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setRegenerateDialog(false);
                setStyleInstruction("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRegenerate} disabled={isRegenerating}>
              {isRegenerating ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Regenerate Story
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}