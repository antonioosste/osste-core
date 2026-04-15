import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BookOpen, Search, Eye, MoreVertical, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { StoryCardSkeleton } from "@/components/loaders/StoryCardSkeleton";
import { useStories } from "@/hooks/useStories";
import { useStoryGroups } from "@/hooks/useStoryGroups";

type StoryStatus = "draft" | "polished" | "approved";

export function MobileStories() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; storyId?: string }>({ open: false });
  const { stories: dbStories, loading, updateStory, deleteStory } = useStories();
  const { storyGroups } = useStoryGroups();

  const getBookTitle = (sgId: string | null) => {
    if (!sgId) return null;
    return storyGroups?.find((g) => g.id === sgId)?.title || null;
  };

  const mappedStories = dbStories.map((s) => {
    const bookTitle = getBookTitle(s.story_group_id);
    return {
      id: s.id,
      storyGroupId: s.story_group_id,
      title: s.title || bookTitle || "Untitled Story",
      summary: s.edited_text?.substring(0, 120) || s.raw_text?.substring(0, 120) || "No content yet",
      status: (s.approved ? "approved" : s.edited_text ? "polished" : "draft") as StoryStatus,
      wordCount: (s.edited_text || s.raw_text || "").split(" ").length,
      date: s.created_at || new Date().toISOString(),
    };
  });

  const filtered = mappedStories.filter(
    (s) =>
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColor: Record<StoryStatus, "default" | "secondary" | "outline"> = {
    approved: "default",
    polished: "secondary",
    draft: "outline",
  };

  return (
    <div className="px-5 pt-safe-top">
      {/* Header */}
      <div className="pt-10 pb-4">
        <h1 className="text-2xl font-serif font-bold text-foreground">Stories</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your written stories</p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search stories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 h-11 rounded-xl"
        />
      </div>

      {/* Story List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <StoryCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={searchTerm ? "No stories found" : "No stories yet"}
          description={searchTerm ? "Try a different search" : "Generate stories from your recordings"}
        />
      ) : (
        <div className="space-y-3 pb-4">
          {filtered.map((story) => (
            <Card
              key={story.id}
              className="border-border/40 cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => navigate(`/books/${story.storyGroupId || ""}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-foreground line-clamp-1 flex-1">
                    {story.title}
                  </h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant={statusColor[story.status]} className="text-[10px] px-2 py-0.5">
                      {story.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/books/${story.storyGroupId || ""}`); }}>
                          <Eye className="h-4 w-4 mr-2" /> View
                        </DropdownMenuItem>
                        {story.status !== "approved" && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateStory(story.id, { approved: true }); }}>
                            <CheckCircle className="h-4 w-4 mr-2" /> Approve
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, storyId: story.id }); }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{story.summary}</p>
                <p className="text-[10px] text-muted-foreground">{story.wordCount} words</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={deleteDialog.open} onOpenChange={(o) => setDeleteDialog({ open: o })}>
        <DialogContent className="mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete Story?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false })} className="rounded-xl">Cancel</Button>
            <Button variant="destructive" onClick={() => { if (deleteDialog.storyId) deleteStory(deleteDialog.storyId); setDeleteDialog({ open: false }); }} className="rounded-xl">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
