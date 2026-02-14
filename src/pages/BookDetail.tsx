import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Plus, 
  BookOpen, 
  Mic, 
  Sparkles, 
  Edit,
  FileText,
  Loader2,
  Printer,
  RotateCcw,
  AlertTriangle
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { Header } from "@/components/layout/Header";
import { ChapterCard } from "@/components/chapters/ChapterCard";
import { GeneratingOverlay } from "@/components/loaders/GeneratingOverlay";
import { useStoryGroups } from "@/hooks/useStoryGroups";
import { useSessions } from "@/hooks/useSessions";
import { useStories } from "@/hooks/useStories";
import { useChapters } from "@/hooks/useChapters";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { assembleStory } from "@/lib/backend-api";
import { supabase } from "@/integrations/supabase/client";

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
  const [isDeletingChapter, setIsDeletingChapter] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [showStyleDialog, setShowStyleDialog] = useState(false);
  const [styleInstruction, setStyleInstruction] = useState("");
  const [recordingsBySession, setRecordingsBySession] = useState<Record<string, { duration_seconds: number }[]>>({});

  // Get sessions for this book
  const bookSessions = sessions.filter(s => s.story_group_id === bookId);
  
  // Create a map of session_id -> chapter data from chapters table
  const chaptersBySessionId = chapters.reduce((acc, ch) => {
    if (ch.session_id) {
      acc[ch.session_id] = ch;
    }
    return acc;
  }, {} as Record<string, typeof chapters[0]>);
  
  // Get story for this book - check if it has actual content
  const bookStoryRecord = stories.find(s => s.story_group_id === bookId);
  const bookStory = bookStoryRecord && (bookStoryRecord.raw_text || bookStoryRecord.edited_text) 
    ? bookStoryRecord 
    : null;

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

  // Fetch recordings for all sessions in this book
  useEffect(() => {
    const fetchRecordings = async () => {
      if (bookSessions.length === 0) return;
      
      const sessionIds = bookSessions.map(s => s.id);
      const { data, error } = await supabase
        .from('recordings')
        .select('session_id, duration_seconds')
        .in('session_id', sessionIds);
      
      if (error) {
        console.error('Error fetching recordings:', error);
        return;
      }
      
      // Group recordings by session_id
      const grouped = (data || []).reduce((acc, rec) => {
        const sid = rec.session_id;
        if (sid) {
          if (!acc[sid]) acc[sid] = [];
          acc[sid].push({ duration_seconds: rec.duration_seconds || 0 });
        }
        return acc;
      }, {} as Record<string, { duration_seconds: number }[]>);
      
      setRecordingsBySession(grouped);
    };
    
    fetchRecordings();
  }, [bookSessions.length]);

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
    
    setIsDeletingChapter(true);
    try {
      await deleteSession(deleteChapterId);
      setDeleteChapterId(null);
    } catch (error) {
      console.error('Error deleting chapter:', error);
    } finally {
      setIsDeletingChapter(false);
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
      
      const result = await assembleStory(
        session.access_token,
        firstSessionId,
        withStyle ? styleInstruction.trim() : null
      );

      await refetchStories();

      // If backend returned a suggested title and story has no title yet, save it
      // Per spec: Only save generated title if story previously had no title
      if (result?.story?.title && bookStoryRecord && !bookStoryRecord.title) {
        try {
          await supabase
            .from('stories')
            .update({ title: result.story.title })
            .eq('id', bookStoryRecord.id);
          await refetchStories();
        } catch (titleError) {
          console.warn('Could not save suggested title:', titleError);
        }
      }

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
      
      {/* Story Generation Overlay */}
      <GeneratingOverlay 
        isVisible={isGeneratingStory} 
        type="story" 
        title={book?.title}
      />
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
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="w-6 sm:w-8 h-6 sm:h-8 text-primary shrink-0" />
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

        <Separator className="mb-6" />

        {/* Tabbed content: Sessions · Chapters · Manuscript */}
        <Tabs defaultValue="sessions" className="mb-8">
          <TabsList className="mb-6">
            <TabsTrigger value="sessions" className="gap-1.5">
              <Mic className="w-4 h-4" />
              Sessions
              <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                {bookSessions.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="chapters" className="gap-1.5">
              <FileText className="w-4 h-4" />
              Chapters
            </TabsTrigger>
            <TabsTrigger value="manuscript" className="gap-1.5">
              <BookOpen className="w-4 h-4" />
              Manuscript
            </TabsTrigger>
          </TabsList>

          {/* ── Sessions Tab ── */}
          <TabsContent value="sessions">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-serif font-bold text-foreground">Sessions</h2>
                <p className="text-muted-foreground">Recording sessions that make up this book</p>
              </div>
              <Button onClick={() => navigate(`/session?bookId=${bookId}`)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Session
              </Button>
            </div>

            {bookSessions.length === 0 ? (
              <EmptyState
                icon={Mic}
                title="No sessions yet"
                description="Start recording to add your first session to this book"
                action={{
                  label: "Start Recording",
                  onClick: () => navigate(`/session?bookId=${bookId}`)
                }}
              />
            ) : (
              <div className="space-y-3">
                {bookSessions
                  .sort((a, b) => new Date(a.started_at || 0).getTime() - new Date(b.started_at || 0).getTime())
                  .map((sessionItem, index) => {
                    const chapterData = chaptersBySessionId[sessionItem.id];
                    const chapterTitle = getChapterDisplayTitle(sessionItem, chapterData);
                    
                    const chapterText = chapterData?.polished_text || chapterData?.raw_transcript || '';
                    const wordCount = chapterText.trim() ? chapterText.trim().split(/\s+/).length : 0;
                    
                    const sessionRecordings = recordingsBySession[sessionItem.id] || [];
                    const recordingDurationSeconds = sessionRecordings.reduce((sum, r) => sum + (r.duration_seconds || 0), 0);
                    
                    return (
                      <ChapterCard
                        key={sessionItem.id}
                        sessionId={sessionItem.id}
                        chapterId={chapterData?.id}
                        chapterIndex={index + 1}
                        title={chapterTitle}
                        status={sessionItem.status || 'active'}
                        startedAt={sessionItem.started_at}
                        endedAt={sessionItem.ended_at}
                        mode={sessionItem.mode}
                        hasChapterContent={!!chapterData}
                        wordCount={wordCount}
                        recordingDurationSeconds={recordingDurationSeconds}
                        onEdit={async (sessionId, newTitle) => {
                          await updateSession(sessionId, { title: newTitle });
                          toast({
                            title: "Session title updated",
                            description: "Your changes have been saved"
                          });
                        }}
                        onDelete={(sessionId) => setDeleteChapterId(sessionId)}
                      />
                    );
                  })}
              </div>
            )}
          </TabsContent>

          {/* ── Chapters Tab ── */}
          <TabsContent value="chapters">
            <div className="mb-6">
              <h2 className="text-2xl font-serif font-bold text-foreground">Chapters</h2>
              <p className="text-muted-foreground">Polished chapter content generated from your sessions</p>
            </div>

            {(() => {
              const chaptersWithContent = bookSessions
                .map(s => ({ session: s, chapter: chaptersBySessionId[s.id] }))
                .filter(({ chapter }) => chapter && (chapter.polished_text || chapter.raw_transcript));
              
              if (chaptersWithContent.length === 0) {
                return (
                  <EmptyState
                    icon={FileText}
                    title="No chapters yet"
                    description="Chapters are generated from your recording sessions. Complete a session to see chapter content here."
                  />
                );
              }

              return (
                <div className="space-y-4">
                  {chaptersWithContent.map(({ session: sessionItem, chapter: chapterData }, index) => (
                    <Card key={chapterData!.id} className="border-border/40">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-serif">
                            Chapter {index + 1}: {chapterData!.suggested_cover_title || chapterData!.title || sessionItem.title || 'Untitled'}
                          </CardTitle>
                          <Badge variant="secondary">
                            {(chapterData!.polished_text || '').split(/\s+/).length} words
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground line-clamp-3 text-sm">
                          {chapterData!.polished_text || chapterData!.raw_transcript || 'No content'}
                        </p>
                        {chapterData!.id && (
                          <Button 
                            variant="link" 
                            className="px-0 mt-2" 
                            onClick={() => navigate(`/chapters/${chapterData!.id}`)}
                          >
                            Read full chapter →
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            })()}
          </TabsContent>

          {/* ── Manuscript Tab ── */}
          <TabsContent value="manuscript">
            {bookStory ? (
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader>
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Manuscript
                      </CardTitle>
                      <CardDescription>
                        Generated from {bookSessions.length} session{bookSessions.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                      <Button onClick={() => navigate(`/stories/${bookStory.id}`)} className="flex-1 sm:flex-none min-h-[44px]">
                        <BookOpen className="w-4 h-4 mr-2" />
                        View Manuscript
                      </Button>
                      {bookStory.approved && (
                        <Button 
                          variant="outline"
                          onClick={() => navigate(`/book/preview/${bookStory.id}`)}
                          className="flex-1 sm:flex-none min-h-[44px]"
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Preview Book
                        </Button>
                      )}
                      <Button 
                        variant="outline"
                        onClick={() => setShowStyleDialog(true)}
                        disabled={isGeneratingStory}
                        className="flex-1 sm:flex-none min-h-[44px]"
                      >
                        <RotateCcw className={`w-4 h-4 mr-2 ${isGeneratingStory ? 'animate-spin' : ''}`} />
                        Rewrite
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => navigate(`/print-request?group=${bookId}`)}
                        className="flex-1 sm:flex-none min-h-[44px]"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Order Print
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-3">
                    {bookStory.edited_text || bookStory.raw_text || "Your manuscript content will appear here"}
                  </p>
                </CardContent>
              </Card>
            ) : bookSessions.length > 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <Sparkles className="w-12 h-12 text-primary/50 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Generate Your Manuscript</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    You have {bookSessions.length} session{bookSessions.length !== 1 ? 's' : ''} recorded. 
                    Generate your manuscript to create a polished narrative from all your recordings.
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
                          Generate Manuscript
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
            ) : (
              <EmptyState
                icon={FileText}
                title="No manuscript yet"
                description="Record at least one session, then generate your manuscript from the recordings."
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Delete Chapter Dialog */}
        <AlertDialog open={!!deleteChapterId} onOpenChange={(open) => !isDeletingChapter && !open && setDeleteChapterId(null)}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-full bg-destructive/10">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <AlertDialogTitle className="text-xl">Delete this chapter?</AlertDialogTitle>
              </div>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  <p className="text-destructive font-medium">
                    This will delete the chapter, its audio recordings, transcript, images, and turns. This cannot be undone.
                  </p>
                  
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                    <p className="font-semibold text-foreground mb-2">What will be deleted:</p>
                    <ul className="space-y-1.5 text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span>Chapter (generated content)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Mic className="w-4 h-4 text-primary" />
                        <span>Audio recordings + files</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span>Transcripts</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span>Turns (conversation data)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span>Images + image files</span>
                      </li>
                    </ul>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    The book and story will remain intact.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel disabled={isDeletingChapter}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteChapter}
                disabled={isDeletingChapter}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeletingChapter ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Chapter'
                )}
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
