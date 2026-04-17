import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Plus, ChevronRight, Mic, ArrowLeft } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStoryGroups } from "@/hooks/useStoryGroups";

interface MobileStartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type View = "choose" | "pickBook" | "createBook";

/**
 * Mobile Start Story flow.
 * Step 1: Continue existing book OR create new
 * Step 2 (existing): pick a book -> /session?bookId=...
 * Step 2 (new):     name a book  -> create -> /session?bookId=...
 *
 * Always launches recording in non-guided mode for the simplest flow.
 */
export function MobileStartSheet({ open, onOpenChange }: MobileStartSheetProps) {
  const navigate = useNavigate();
  const { storyGroups, createStoryGroup } = useStoryGroups();
  const [view, setView] = useState<View>("choose");
  const [newTitle, setNewTitle] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setView("choose");
    setNewTitle("");
    setBusy(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const goRecord = (bookId: string) => {
    onOpenChange(false);
    // small delay so the sheet closes smoothly before route transition
    setTimeout(() => {
      navigate(`/session?bookId=${bookId}&mode=non-guided`);
      reset();
    }, 120);
  };

  const handleStartFromExisting = (bookId: string) => {
    goRecord(bookId);
  };

  const handleCreateAndStart = async () => {
    if (!newTitle.trim() || busy) return;
    setBusy(true);
    try {
      const book = await createStoryGroup(newTitle.trim());
      goRecord(book.id);
    } catch (e) {
      console.error(e);
      setBusy(false);
    }
  };

  const hasBooks = (storyGroups?.length ?? 0) > 0;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t-0 px-5 pb-8 pt-6 max-h-[85vh] overflow-y-auto"
      >
        <SheetHeader className="text-left mb-4">
          {view !== "choose" && (
            <button
              onClick={() => setView("choose")}
              className="flex items-center gap-1 text-xs text-muted-foreground mb-2 -ml-1 active:opacity-60"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
          )}
          <SheetTitle className="font-serif text-xl">
            {view === "choose" && "Start a story"}
            {view === "pickBook" && "Choose a book"}
            {view === "createBook" && "Name your book"}
          </SheetTitle>
          <SheetDescription className="text-sm">
            {view === "choose" && "Add a chapter to an existing book, or start a new one."}
            {view === "pickBook" && "Your next chapter will be added here."}
            {view === "createBook" && "Give this collection of memories a name."}
          </SheetDescription>
        </SheetHeader>

        {view === "choose" && (
          <div className="space-y-2 animate-fade-in">
            {hasBooks && (
              <button
                onClick={() => setView("pickBook")}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border border-border/50 bg-card active:scale-[0.99] transition-transform text-left"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Continue an existing book</p>
                  <p className="text-xs text-muted-foreground">
                    {storyGroups.length} {storyGroups.length === 1 ? "book" : "books"} ready
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              </button>
            )}

            <button
              onClick={() => setView("createBook")}
              className="w-full flex items-center gap-3 p-4 rounded-2xl border border-border/50 bg-card active:scale-[0.99] transition-transform text-left"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Create a new book</p>
                <p className="text-xs text-muted-foreground">Begin a fresh collection</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
            </button>
          </div>
        )}

        {view === "pickBook" && (
          <div className="space-y-2 animate-fade-in">
            {storyGroups.map((book) => (
              <button
                key={book.id}
                onClick={() => handleStartFromExisting(book.id)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-border/40 bg-card active:scale-[0.99] transition-transform text-left"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4 text-primary/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{book.title}</p>
                  {book.description && (
                    <p className="text-xs text-muted-foreground truncate">{book.description}</p>
                  )}
                </div>
                <Mic className="h-4 w-4 text-primary shrink-0" />
              </button>
            ))}
          </div>
        )}

        {view === "createBook" && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-2">
              <Label htmlFor="book-name">Book name</Label>
              <Input
                id="book-name"
                autoFocus
                placeholder="e.g., My Childhood"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-12 rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateAndStart();
                }}
              />
            </div>
            <Button
              onClick={handleCreateAndStart}
              disabled={!newTitle.trim() || busy}
              size="lg"
              className="w-full h-12 rounded-xl gap-2"
            >
              <Mic className="h-4 w-4" />
              {busy ? "Creating…" : "Start recording"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
