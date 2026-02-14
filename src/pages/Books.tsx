import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  BookOpen, 
  Trash2, 
  ChevronRight,
  FolderOpen,
  Sparkles,
  FileText,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { useStoryGroups } from "@/hooks/useStoryGroups";
import { useSessions } from "@/hooks/useSessions";
import { useStories } from "@/hooks/useStories";

export default function Books() {
  const navigate = useNavigate();
  const { storyGroups, loading, createStoryGroup, deleteStoryGroup } = useStoryGroups();
  const { sessions } = useSessions();
  const { stories } = useStories();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookDescription, setNewBookDescription] = useState('');
  const [deleteBookId, setDeleteBookId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Get chapter count per book
  const getChapterCount = (bookId: string) => {
    return sessions.filter(s => s.story_group_id === bookId).length;
  };

  // Get story for a book
  const getBookStory = (bookId: string) => {
    return stories.find(s => s.story_group_id === bookId);
  };

  const handleCreateBook = async () => {
    if (!newBookTitle.trim()) return;
    
    try {
      const newBook = await createStoryGroup(newBookTitle.trim(), newBookDescription.trim() || undefined);
      setIsCreateDialogOpen(false);
      setNewBookTitle('');
      setNewBookDescription('');
      // Navigate to the new book
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

  const filteredBooks = storyGroups?.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (book.description && book.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const formatDate = (date: string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">My Books</h1>
          <p className="text-muted-foreground">
            Create and manage your life story books
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="w-4 h-4 mr-2" />
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

      {/* Search */}
      {storyGroups && storyGroups.length > 0 && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search books..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {/* Books Grid */}
      {loading ? (
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
      ) : filteredBooks.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBooks.map((book) => {
            const chapterCount = getChapterCount(book.id);
            const bookStory = getBookStory(book.id);
            
            return (
              <Card 
                key={book.id} 
                className="border-border/40 hover:shadow-md transition-all cursor-pointer group"
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
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {bookStory && (
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>Story ready</span>
                      </div>
                    )}
                    {!bookStory && chapterCount > 0 && (
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Ready to generate</span>
                      </div>
                    )}
                    <span>•</span>
                    <span>{formatDate(book.created_at)}</span>
                  </div>
                  
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : searchTerm ? (
        <EmptyState
          icon={Search}
          title="No books found"
          description="Try adjusting your search terms"
        />
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No Books Yet"
          description="Create your first book to start capturing your life stories"
          action={{
            label: "Create Your First Book",
            onClick: () => setIsCreateDialogOpen(true)
          }}
        />
      )}

      {/* Delete Confirmation */}
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
