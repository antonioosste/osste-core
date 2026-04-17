import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Search, Feather, Plus, ChevronRight, MoreVertical, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useStoryGroups } from "@/hooks/useStoryGroups";
import { useSessions } from "@/hooks/useSessions";
import { useChapters } from "@/hooks/useChapters";

function relativeDate(date: string | null): string {
  if (!date) return "";
  const d = new Date(date);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return "Updated today";
  if (diff === 1) return "Updated yesterday";
  if (diff < 7) return `Updated ${diff} days ago`;
  if (diff < 30) return `Updated ${Math.floor(diff / 7)}w ago`;
  return `Updated ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export function MobileStories() {
  const navigate = useNavigate();
  const { storyGroups, loading, createStoryGroup, deleteBookDeep } = useStoryGroups();
  const { sessions } = useSessions();
  const { chapters } = useChapters();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getBookMeta = (bookId: string) => {
    const bookSessions = sessions.filter((s) => s.story_group_id === bookId);
    const bookChapters = chapters.filter((c) =>
      bookSessions.some((s) => s.id === c.session_id)
    );
    // Latest activity = max of session.started_at and chapter.created_at
    let latest = 0;
    bookSessions.forEach((s) => {
      const t = s.started_at ? new Date(s.started_at).getTime() : 0;
      if (t > latest) latest = t;
    });
    bookChapters.forEach((c) => {
      const t = c.created_at ? new Date(c.created_at).getTime() : 0;
      if (t > latest) latest = t;
    });
    return {
      chapterCount: bookChapters.length,
      lastUpdated: latest > 0 ? new Date(latest).toISOString() : null,
    };
  };

  const filteredBooks =
    storyGroups?.filter(
      (b) =>
        b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.description && b.description.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      const book = await createStoryGroup(newTitle.trim(), newDesc.trim() || undefined);
      setIsCreateOpen(false);
      setNewTitle("");
      setNewDesc("");
      navigate(`/books/${book.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleContinue = (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    navigate(`/books/${bookId}`);
  };

  return (
    <div className="px-5 pt-safe-top pb-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-10 pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">My Books</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your story collections</p>
        </div>
        <Button
          size="sm"
          className="rounded-xl h-10 gap-1.5"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>

      {/* Search */}
      {storyGroups && storyGroups.length > 3 && (
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search books..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-11 rounded-xl"
          />
        </div>
      )}

      {/* Book List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 animate-fade-in">
          <Feather className="h-12 w-12 text-muted-foreground/25 mb-4" />
          <p className="text-base font-medium text-foreground mb-1">
            {searchTerm ? "No books found" : "No books yet"}
          </p>
          <p className="text-sm text-muted-foreground max-w-[240px] leading-relaxed mb-5">
            {searchTerm
              ? "Try a different search"
              : "Create your first book to start capturing your life stories"}
          </p>
          {!searchTerm && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" /> Create Your First Book
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBooks.map((book, idx) => {
            const { chapterCount, lastUpdated } = getBookMeta(book.id);

            return (
              <Card
                key={book.id}
                className="border-border/40 cursor-pointer active:scale-[0.98] transition-transform animate-fade-in"
                style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}
                onClick={() => navigate(`/books/${book.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                      <BookOpen className="h-5 w-5 text-primary/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-base font-serif font-semibold text-foreground line-clamp-1">
                          {book.title}
                        </h3>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {chapterCount === 0
                          ? "No chapters yet"
                          : `${chapterCount} ${chapterCount === 1 ? "chapter" : "chapters"}`}
                        {lastUpdated && ` · ${relativeDate(lastUpdated)}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full h-10 rounded-xl text-sm"
                    onClick={(e) => handleContinue(e, book.id)}
                  >
                    {chapterCount === 0 ? "Start story" : "Continue"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Book Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Create New Book</DialogTitle>
            <DialogDescription>Give your story collection a name</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="mb-title">Book Title</Label>
              <Input
                id="mb-title"
                placeholder="e.g., My Childhood"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mb-desc">Description (Optional)</Label>
              <Textarea
                id="mb-desc"
                placeholder="What will this book be about?"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={3}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newTitle.trim()} className="rounded-xl">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
