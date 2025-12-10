import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
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
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Header } from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";
import { useStories } from "@/hooks/useStories";
import { StoryImageUploader, UploadedImage } from "@/components/ui/story-image-uploader";
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
  const { toast } = useToast();
  const { getStory, updateStory } = useStories();
  const [story, setStory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [regenerateDialog, setRegenerateDialog] = useState(false);
  
  const [styleInstruction, setStyleInstruction] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [sessionIdForImages, setSessionIdForImages] = useState<string | undefined>();
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Use hook for synchronized image management
  const { images: uploadedImages, deleteImage, refetch: refetchImages } = useStoryImages({ 
    sessionId: sessionIdForImages,
    storyId: id 
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
          // Story no longer has session_id, it has story_group_id
          // Images should be linked to story_id directly
          setSessionIdForImages(undefined);
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
    if (sessionIdForImages) {
      refetchImages();
    }
  }, [sessionIdForImages]);

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
    if (!story?.session_id) {
      toast({
        title: "Error",
        description: "Unable to regenerate story - session not found.",
        variant: "destructive"
      });
      return;
    }

    setIsRegenerating(true);
    setRegenerateDialog(false);

    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error("Authentication required");
      }

      toast({
        title: "Regenerating story...",
        description: styleInstruction 
          ? "AI is creating a new version with your style preferences." 
          : "AI is creating a new version based on the transcript."
      });

      // Call backend API with optional style instruction
      const result = await assembleStory(
        session.access_token,
        story.session_id,
        styleInstruction.trim() || null
      );

      // Fetch updated story from database
      const updatedStory = await getStory(id!);
      
      if (updatedStory) {
        setStory(updatedStory);
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
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link to="/stories">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Stories
            </Link>
          </Button>
        </div>

        {/* Story Header */}
        <div className="mb-8" ref={contentRef}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {story.title || "Untitled Story"}
              </h1>
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
            <div className="flex gap-2 ml-4">
              <Button onClick={handleApprove} className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Approve
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setRegenerateDialog(true)}
                className="gap-2"
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
              <div className="prose max-w-none">
                <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {story.raw_text || "No original content available"}
                </div>
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
                <div className="prose max-w-none">
                  <div 
                    className="font-serif text-foreground leading-relaxed max-h-[600px] overflow-y-auto whitespace-pre-wrap"
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    {displayContent}
                  </div>
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
            {sessionIdForImages && (
              <StoryImageUploader 
                sessionId={sessionIdForImages}
                storyId={id}
                usage="embedded"
                maxFiles={10}
                maxSizeMB={8}
                onUploadSuccess={handleImageUploadSuccess}
              />
            )}
            
            {uploadedImages.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Session Images ({uploadedImages.length})</h4>
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

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button className="flex-1" asChild>
            <Link to="/book/preview">Add to Book</Link>
          </Button>
          <Button variant="outline" className="flex-1 gap-2">
            <Share2 className="w-4 h-4" />
            Share with Family
          </Button>
          <Button variant="outline" className="flex-1 gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </div>
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