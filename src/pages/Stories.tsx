import { useState } from "react";
import { Search, Plus, BookOpen, MoreVertical, Trash2, Eye, CheckCircle, Edit } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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

export default function Stories() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | StoryStatus>("all");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; storyId?: string }>({ open: false });
  const { stories: dbStories, loading: isLoading, updateStory, deleteStory: deleteStoryDb } = useStories();
  const { storyGroups } = useStoryGroups();

  // Helper to get book title by story_group_id
  const getBookTitle = (storyGroupId: string | null) => {
    if (!storyGroupId) return null;
    const book = storyGroups?.find(g => g.id === storyGroupId);
    return book?.title || null;
  };

  // Map database stories to UI format
  // Title hierarchy: story.title (if set) -> book.title (fallback) -> "Untitled Story"
  const mappedStories = dbStories.map(story => {
    const bookTitle = getBookTitle(story.story_group_id);
    const displayTitle = story.title || bookTitle || "Untitled Story";
    
    return {
      id: story.id,
      title: displayTitle,
      summary: story.edited_text?.substring(0, 150) || story.raw_text?.substring(0, 150) || "No content yet",
      status: (story.approved ? "approved" : story.edited_text ? "polished" : "draft") as StoryStatus,
      updatedDate: story.created_at || new Date().toISOString(),
      wordCount: (story.edited_text || story.raw_text || "").split(' ').length,
    };
  });

  const filteredStories = mappedStories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.summary.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = statusFilter === "all" || story.status === statusFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: StoryStatus) => {
    const statusConfig = {
      draft: { variant: "outline" as const, text: "Draft" },
      polished: { variant: "secondary" as const, text: "Polished" },
      approved: { variant: "default" as const, text: "Approved" }
    };
    
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const handleApprove = async (storyId: string) => {
    try {
      await updateStory(storyId, { approved: true });
    } catch (error) {
      console.error('Error approving story:', error);
    }
  };

  const handleDelete = async (storyId: string) => {
    setDeleteDialog({ open: false });
    try {
      await deleteStoryDb(storyId);
    } catch (error) {
      console.error('Error deleting story:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const StatusChip = ({ status, isActive, onClick }: { status: "all" | StoryStatus; isActive: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
        isActive 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      }`}
    >
      {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
      {status === "all" && ` (${mappedStories.length})`}
      {status !== "all" && ` (${mappedStories.filter(s => s.status === status).length})`}
    </button>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Story Library</h1>
          <p className="text-muted-foreground">
            Browse and manage your captured stories
          </p>
        </div>
        <Button onClick={() => navigate('/session')} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          New Interview
        </Button>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <StatusChip 
          status="all" 
          isActive={statusFilter === "all"} 
          onClick={() => setStatusFilter("all")} 
        />
        <StatusChip 
          status="draft" 
          isActive={statusFilter === "draft"} 
          onClick={() => setStatusFilter("draft")} 
        />
        <StatusChip 
          status="polished" 
          isActive={statusFilter === "polished"} 
          onClick={() => setStatusFilter("polished")} 
        />
        <StatusChip 
          status="approved" 
          isActive={statusFilter === "approved"} 
          onClick={() => setStatusFilter("approved")} 
        />
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search stories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Stories Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <StoryCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredStories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => (
            <Card key={story.id} className="border-border/40 hover:shadow-lg transition-all group overflow-hidden">
              <div className="aspect-[3/4] bg-gradient-to-br from-primary/5 to-primary/10 p-8 flex flex-col items-center justify-center text-center border-b border-border/40">
                <BookOpen className="w-16 h-16 text-primary/40 mb-4" />
                <h3 className="text-xl font-serif font-bold text-foreground line-clamp-3">
                  {story.title}
                </h3>
              </div>
              
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  {getStatusBadge(story.status)}
                  <span className="text-xs text-muted-foreground">
                    {formatDate(story.updatedDate)}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {story.summary}
                </p>
                
                <div className="text-xs text-muted-foreground">
                  {story.wordCount} words
                </div>
                
                <div className="flex gap-2">
                  <Button asChild className="flex-1" size="sm">
                    <Link to={`/stories/${story.id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Link>
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-background border border-border shadow-lg z-50">
                      <DropdownMenuItem asChild>
                        <Link to={`/stories/${story.id}`} className="flex items-center">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      {story.status !== "approved" && (
                        <DropdownMenuItem onClick={() => handleApprove(story.id)}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => setDeleteDialog({ open: true, storyId: story.id })}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title={searchTerm ? "No stories found" : "No stories yet"}
          description={
            searchTerm 
              ? "Try adjusting your search terms or clearing filters."
              : "Start your first voice interview to begin capturing stories."
          }
          action={!searchTerm ? {
            label: "Start Interview",
            onClick: () => navigate('/session'),
          } : undefined}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, storyId: deleteDialog.storyId })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Story?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The story and all its content will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false })}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteDialog.storyId && handleDelete(deleteDialog.storyId)}
            >
              Delete Story
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
