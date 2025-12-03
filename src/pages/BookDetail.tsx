import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Plus, 
  BookOpen, 
  Mic, 
  Sparkles, 
  Trash2, 
  Edit,
  Calendar,
  Clock,
  FileText,
  Loader2,
  ChevronRight,
  Printer,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { Header } from "@/components/layout/Header";
import { useStoryGroups } from "@/hooks/useStoryGroups";
import { useSessions } from "@/hooks/useSessions";
import { useStories } from "@/hooks/useStories";
import { useChapters } from "@/hooks/useChapters";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { assembleStory } from "@/lib/backend-api";

export default function BookDetail() {
  const navigate = useNavigate();
  const { id: bookId } = useParams();
  const { toast } = useToast();
  const { session } = useAuth();
  const { getStoryGroup, updateStoryGroup } = useStoryGroups();
  const { sessions, deleteSession, updateSession } = useSessions();
  const { stories, refetch: refetchStories } = useStories();
  const { chapters } = useChapters();
  
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [deleteChapterId, setDeleteChapterId] = useState<string | null>(null);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [showStyleDialog, setShowStyleDialog] = useState(false);
  const [styleInstruction, setStyleInstruction] = useState("");
  const [editChapterSessionId, setEditChapterSessionId] = useState<string | null>(null);
  const [editChapterTitle, setEditChapterTitle] = useState("");

  // Get sessions for this book
  const bookSessions = sessions.filter(s => s.story_group_id === bookId);
  
  // Create a map of session_id -> chapter data from chapters table
  const chaptersBySessionId = chapters.reduce((acc, ch) => {
    if (ch.session_id) {
      acc[ch.session_id] = ch;
    }
    return acc;
  }, {} as Record<string, typeof chapters[0]>);
  
  // Get story for this book
  const bookStory = stories.find(s => s.story_group_id === bookId);

  useEffect(() => {
    const loadBook = async () => {
      if (!bookId) return;
      
      try {
        setLoading(true);
        const data = await getStoryGroup(bookId);
        if (data) {
          setBook(data);
          setEditTitle(data.title);
          setEditDescription(data.description || "");
        }
      } catch (error) {
        console.error('Error loading book:', error);
        toast({
          title: "Error",
          description: "Failed to load book details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadBook();
  }, [bookId]);

  const handleSaveEdit = async () => {
    if (!bookId || !editTitle.trim()) return;
    
    try {
      await updateStoryGroup(bookId, { 
        title: editTitle.trim(),
        description: editDescription.trim() || undefined
      });
      setBook({ ...book, title: editTitle.trim(), description: editDescription.trim() });
      setIsEditing(false);
      toast({
        title: "Book updated",
        description: "Your changes have been saved"
      });
    } catch (error) {
      console.error('Error updating book:', error);
      toast({
        title: "Error",
        description: "Failed to update book",
        variant: "destructive"
      });
    }
  };

  const handleDeleteChapter = async () => {
    if (!deleteChapterId) return;
    
    try {
      await deleteSession(deleteChapterId);
      setDeleteChapterId(null);
      toast({
        title: "Chapter deleted",
        description: "The chapter has been removed from this book"
      });
    } catch (error) {
      console.error('Error deleting chapter:', error);
      toast({
        title: "Error",
        description: "Failed to delete chapter",
        variant: "destructive"
      });
    }
  };

  const handleSaveChapterTitle = async () => {
    if (!editChapterSessionId || !editChapterTitle.trim()) return;
    
    try {
      await updateSession(editChapterSessionId, { title: editChapterTitle.trim() });
      setEditChapterSessionId(null);
      setEditChapterTitle("");
      toast({
        title: "Chapter title updated",
        description: "Your changes have been saved"
      });
    } catch (error) {
      console.error('Error updating chapter title:', error);
      toast({
        title: "Error",
        description: "Failed to update chapter title",
        variant: "destructive"
      });
    }
  };

  const getChapterDisplayTitle = (sessionItem: typeof sessions[0], chapterData: typeof chapters[0] | undefined) => {
    // Priority: 1. Session title (user edited), 2. Chapter suggested_cover_title, 3. Story anchor (prompt), 4. Chapter title, 5. Fallback
    if (sessionItem.title) return sessionItem.title;
    if (chapterData?.suggested_cover_title) return chapterData.suggested_cover_title;
    if (sessionItem.story_anchor) return sessionItem.story_anchor;
    if (chapterData?.title) return chapterData.title;
    return `Recording ${formatDate(sessionItem.started_at)}`;
  };

  const handleGenerateStory = async (withStyle: boolean = false) => {
    if (!session?.access_token || bookSessions.length === 0) {
      toast({
        title: "Cannot generate story",
        description: bookSessions.length === 0 
          ? "Add at least one chapter first" 
          : "Please log in to generate a story",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingStory(true);
    setShowStyleDialog(false);

    try {
      toast({
        title: "Generating your story...",
        description: "This may take a moment while AI crafts your narrative"
      });

      // Use the first session's ID (the API assembles by story_group)
      const firstSessionId = bookSessions[0].id;
      
      await assembleStory(
        session.access_token,
        firstSessionId,
        withStyle ? styleInstruction.trim() : null
      );

      await refetchStories();

      toast({
        title: "Story generated!",
        description: "Your story is ready to view"
      });

      setStyleInstruction("");
    } catch (error) {
      console.error('Error generating story:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate story",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatDuration = (start: string | null, end: string | null) => {
    if (!start) return "N/A";
    if (!end) return "In Progress";
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    return `${minutes} min`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header isAuthenticated={true} />
        <div className="container mx-auto px-6 py-8 max-w-5xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background">
        <Header isAuthenticated={true} />
        <div className="container mx-auto px-6 py-8 max-w-5xl">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="mt-8">
            <EmptyState
              icon={BookOpen}
              title="Book not found"
              description="The book you're looking for doesn't exist"
              action={{
                label: "Go to Dashboard",
                onClick: () => navigate('/dashboard')
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Back Navigation */}
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Book Header */}
        <div className="mb-8">
          {isEditing ? (
            <div className="space-y-4 max-w-xl">
              <div className="space-y-2">
                <Label htmlFor="title">Book Title</Label>
                <Input
                  id="title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Enter book title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="What is this book about?"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveEdit} disabled={!editTitle.trim()}>
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="w-8 h-8 text-primary" />
                  <h1 className="text-3xl font-serif font-bold text-foreground">
                    {book.title}
                  </h1>
                </div>
                {book.description && (
                  <p className="text-muted-foreground mb-4 max-w-2xl">
                    {book.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Badge variant="secondary">
                    {bookSessions.length} {bookSessions.length === 1 ? 'Chapter' : 'Chapters'}
                  </Badge>
                  {bookStory && (
                    <Badge variant="default">Story Generated</Badge>
                  )}
                  <span>Created {formatDate(book.created_at)}</span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Book
              </Button>
            </div>
          )}
        </div>

        <Separator className="mb-8" />

        {/* Story Section */}
        {bookStory ? (
          <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Your Story
                  </CardTitle>
                  <CardDescription>
                    Generated from {bookSessions.length} chapter{bookSessions.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => navigate(`/stories/${bookStory.id}`)}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    View Story
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowStyleDialog(true)}
                    disabled={isGeneratingStory}
                  >
                    <RotateCcw className={`w-4 h-4 mr-2 ${isGeneratingStory ? 'animate-spin' : ''}`} />
                    Rewrite Story
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/print-request?group=${bookId}`)}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Order Print
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground line-clamp-3">
                {bookStory.edited_text || bookStory.raw_text || "Your story content will appear here"}
              </p>
            </CardContent>
          </Card>
        ) : bookSessions.length > 0 ? (
          <Card className="mb-8 border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Sparkles className="w-12 h-12 text-primary/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Generate Your Story</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                You have {bookSessions.length} chapter{bookSessions.length !== 1 ? 's' : ''} recorded. 
                Generate your story to create a polished narrative from all your recordings.
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleGenerateStory(false)}
                  disabled={isGeneratingStory}
                  size="lg"
                >
                  {isGeneratingStory ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Story
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowStyleDialog(true)}
                  disabled={isGeneratingStory}
                >
                  With Custom Style
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Chapters Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground">Chapters</h2>
              <p className="text-muted-foreground">Recording sessions that make up this book</p>
            </div>
            <Button onClick={() => navigate(`/session?bookId=${bookId}`)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Chapter
            </Button>
          </div>

          {bookSessions.length === 0 ? (
            <EmptyState
              icon={Mic}
              title="No chapters yet"
              description="Start recording to add your first chapter to this book"
              action={{
                label: "Start Recording",
                onClick: () => navigate(`/session?bookId=${bookId}`)
              }}
            />
          ) : (
            <div className="space-y-4">
              {bookSessions
                .sort((a, b) => new Date(a.started_at || 0).getTime() - new Date(b.started_at || 0).getTime())
                .map((sessionItem, index) => {
                  // Get chapter data from the chapters table
                  const chapterData = chaptersBySessionId[sessionItem.id];
                  const chapterTitle = getChapterDisplayTitle(sessionItem, chapterData);
                  const isEditingThis = editChapterSessionId === sessionItem.id;
                  
                  return (
                    <Card key={sessionItem.id} className="border-border/40 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline">Chapter {index + 1}</Badge>
                              {isEditingThis ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <Input
                                    value={editChapterTitle}
                                    onChange={(e) => setEditChapterTitle(e.target.value)}
                                    className="max-w-xs h-8"
                                    placeholder="Chapter title"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveChapterTitle();
                                      if (e.key === 'Escape') setEditChapterSessionId(null);
                                    }}
                                  />
                                  <Button size="sm" variant="default" onClick={handleSaveChapterTitle}>
                                    Save
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setEditChapterSessionId(null)}>
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <h3 className="text-lg font-semibold text-foreground">
                                    {chapterTitle}
                                  </h3>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => {
                                      setEditChapterSessionId(sessionItem.id);
                                      setEditChapterTitle(sessionItem.title || chapterTitle);
                                    }}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                </>
                              )}
                              <Badge variant={sessionItem.status === 'completed' ? 'default' : 'secondary'}>
                                {sessionItem.status === 'completed' ? 'Completed' : 'In Progress'}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {formatDate(sessionItem.started_at)}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                {formatDuration(sessionItem.started_at, sessionItem.ended_at)}
                              </div>
                              {sessionItem.mode && (
                                <div className="flex items-center gap-1.5">
                                  <Mic className="w-4 h-4" />
                                  {sessionItem.mode === 'guided' ? 'Guided' : 'Free Recording'}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                if (chapterData?.id) {
                                  navigate(`/chapters/${chapterData.id}`);
                                } else {
                                  toast({
                                    title: "Chapter not generated yet",
                                    description: "Complete the recording and save to generate the chapter",
                                    variant: "destructive"
                                  });
                                }
                              }}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => navigate(`/session?id=${sessionItem.id}`)}
                            >
                              <Mic className="w-4 h-4 mr-1" />
                              Continue
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setDeleteChapterId(sessionItem.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </div>

        {/* Delete Chapter Dialog */}
        <AlertDialog open={!!deleteChapterId} onOpenChange={() => setDeleteChapterId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Chapter?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p className="font-semibold text-destructive">Warning: This action cannot be undone!</p>
                <p>This will permanently delete:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>All audio recordings in this chapter</li>
                  <li>All transcripts</li>
                  <li>All conversation history</li>
                  <li>All uploaded images</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteChapter} 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Chapter
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Style Instruction Dialog */}
        <Dialog open={showStyleDialog} onOpenChange={setShowStyleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {bookStory ? 'Rewrite Your Story' : 'Generate with Custom Style'}
              </DialogTitle>
              <DialogDescription>
                Add style instructions to customize how your story is written
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="style">Style Instructions (Optional)</Label>
                <Textarea
                  id="style"
                  value={styleInstruction}
                  onChange={(e) => setStyleInstruction(e.target.value)}
                  placeholder="e.g., Make it more emotional, Use a poetic tone, Focus on the humor"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStyleDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleGenerateStory(styleInstruction.trim().length > 0)}
                disabled={isGeneratingStory}
              >
                {isGeneratingStory ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {bookStory ? 'Rewrite Story' : 'Generate Story'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
