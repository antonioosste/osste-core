import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { 
  Mic, 
  BookOpen, 
  Play, 
  ArrowRight,
  Crown,
  FileText,
  Plus,
  FolderOpen,
  Sparkles,
  ChevronRight,
  Trash2,
  Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSessions } from "@/hooks/useSessions";
import { useStories } from "@/hooks/useStories";
import { useProfile } from "@/hooks/useProfile";
import { useRecordings } from "@/hooks/useRecordings";
import { useStoryGroups } from "@/hooks/useStoryGroups";

export default function Dashboard() {
  const navigate = useNavigate();
  const { sessions } = useSessions();
  const { stories } = useStories();
  const { profile } = useProfile();
  const { recordings } = useRecordings();
  const { storyGroups, loading: groupsLoading, createStoryGroup, deleteStoryGroup } = useStoryGroups();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookDescription, setNewBookDescription] = useState('');
  const [deleteBookId, setDeleteBookId] = useState<string | null>(null);
  
  const userPaid = profile?.plan !== 'free';
  
  // Calculate stats
  const totalBooks = storyGroups?.length || 0;
  const totalChapters = sessions.length;
  const totalStories = stories.length;
  
  // Calculate total minutes recorded
  const totalMinutesRecorded = recordings.reduce((acc, recording) => {
    return acc + (recording.duration_seconds || 0);
  }, 0) / 60;
  
  // Define total minutes available based on plan
  const totalMinutesAvailable = userPaid ? 999999 : 30;
  
  // Find active chapter (in-progress recording session)
  const activeChapter = sessions.find(s => s.status === 'active' || !s.ended_at);

  // Get chapter count per book
  const getChapterCount = (bookId: string) => {
    return sessions.filter(s => s.story_group_id === bookId).length;
  };

  // Get story for a book
  const getBookStory = (bookId: string) => {
    return stories.find(s => s.story_group_id === bookId);
  };

  // Get book title for a session
  const getBookTitle = (bookId: string | null) => {
    if (!bookId) return "Unassigned";
    const book = storyGroups?.find(g => g.id === bookId);
    return book?.title || "Unknown Book";
  };

  const handleCreateBook = async () => {
    if (!newBookTitle.trim()) return;
    
    try {
      const newBook = await createStoryGroup(newBookTitle.trim(), newBookDescription.trim() || undefined);
      setIsCreateDialogOpen(false);
      setNewBookTitle('');
      setNewBookDescription('');
      navigate(`/books/${newBook.id}`);
    } catch (error) {
      console.error('Failed to create book:', error);
    }
  };

  const handleDeleteBook = async () => {
    if (!deleteBookId) return;
    
    try {
      await deleteStoryGroup(deleteBookId);
      setDeleteBookId(null);
    } catch (error) {
      console.error('Failed to delete book:', error);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-serif font-bold text-foreground mb-3">
          Welcome back{profile?.name ? `, ${profile.name}` : ''}
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Continue capturing the memories that matter most
        </p>
        
        <div className="flex gap-3">
          <Button 
            size="lg" 
            className="gap-2 text-lg px-8 py-6 h-auto"
            onClick={() => navigate('/session')}
          >
            <Play className="w-5 h-5" />
            Start Recording
          </Button>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                variant="outline"
                className="gap-2 text-lg px-8 py-6 h-auto"
              >
                <Plus className="w-5 h-5" />
                New Book
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Book</DialogTitle>
                <DialogDescription>
                  Start a new book project. Add chapters through recording sessions to build your story.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Book Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., My Childhood, Family Memories, Career Journey"
                    value={newBookTitle}
                    onChange={(e) => setNewBookTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="What will this book be about?"
                    value={newBookDescription}
                    onChange={(e) => setNewBookDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateBook} disabled={!newBookTitle.trim()}>
                  Create Book
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Paywall Card for Unpaid Users */}
      {!userPaid && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 mb-8">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Unlock Full Access</h3>
                <p className="text-sm text-muted-foreground">
                  Get unlimited recording time and advanced features
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/pricing')} className="shrink-0">
              View Plans
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid gap-6 md:grid-cols-3 mb-12">
        <Card 
          className="border-border/40 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/books')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="h-8 w-8 text-primary/70" />
              <span className="text-3xl font-bold text-foreground">{totalBooks}</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Books Created</p>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/40 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Mic className="h-8 w-8 text-primary/70" />
              <span className="text-3xl font-bold text-foreground">{totalChapters}</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Chapters Recorded</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <FileText className="h-8 w-8 text-primary/70" />
              <div className="text-right">
                <span className="text-3xl font-bold text-foreground">
                  {Math.round(totalMinutesRecorded)}
                </span>
                <span className="text-lg text-muted-foreground">
                  {userPaid ? '' : ` / ${totalMinutesAvailable}`}
                </span>
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Minutes Recorded {userPaid ? '(Unlimited)' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Books Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-serif font-bold text-foreground">Your Books</h2>
            <p className="text-muted-foreground">Build and organize your life story books</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/books')}>
            View All
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {groupsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse border-border/40">
                <CardHeader className="space-y-3">
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                </CardHeader>
                <CardContent>
                  <div className="h-10 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : storyGroups && storyGroups.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {storyGroups.slice(0, 6).map((book) => {
              const chapterCount = getChapterCount(book.id);
              const bookStory = getBookStory(book.id);
              
              return (
                <Card 
                  key={book.id} 
                  className="border-border/40 hover:shadow-md transition-shadow group cursor-pointer"
                  onClick={() => navigate(`/books/${book.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-5 w-5 text-primary" />
                        <Badge variant={bookStory ? "default" : "secondary"}>
                          {chapterCount} {chapterCount === 1 ? 'chapter' : 'chapters'}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteBookId(book.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle className="line-clamp-1 text-foreground">{book.title}</CardTitle>
                    {book.description && (
                      <CardDescription className="line-clamp-2">
                        {book.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      size="sm" 
                      className="w-full"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/books/${book.id}`);
                      }}
                    >
                      Open Book
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                    
                    {chapterCount > 0 && !bookStory && (
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/books/${book.id}`);
                        }}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Story
                      </Button>
                    )}
                    
                    {bookStory && (
                      <>
                        <Button 
                          size="sm" 
                          className="w-full"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/stories/${bookStory.id}`);
                          }}
                        >
                          <BookOpen className="mr-2 h-4 w-4" />
                          View Story
                        </Button>
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/print-request?group=${book.id}`);
                          }}
                        >
                          <Printer className="mr-2 h-4 w-4" />
                          Order Print Copy
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-border/40">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Books Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first book to start building your life story
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Book
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Continue Active Chapter */}
      {activeChapter && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Continue Your Active Chapter</h3>
                <p className="text-muted-foreground">
                  {(activeChapter as any).title || "Untitled Chapter"} • {getBookTitle(activeChapter.story_group_id)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Started {activeChapter.started_at ? new Date(activeChapter.started_at).toLocaleDateString() : 'recently'}
                </p>
              </div>
              <Button onClick={() => navigate(`/session?id=${activeChapter.id}`)}>
                <Play className="w-4 h-4 mr-2" />
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deleteBookId} onOpenChange={() => setDeleteBookId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this book?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this book and all its chapters, recordings, and stories. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteBook}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Book
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
