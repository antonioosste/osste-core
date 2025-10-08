import { useState, useEffect } from "react";
import { Search, Filter, Grid, List, Plus, BookOpen, MoreVertical, Trash2, Eye, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { StoryCardSkeleton } from "@/components/loaders/StoryCardSkeleton";
import { useToast } from "@/hooks/use-toast";
import { useStories } from "@/hooks/useStories";

type StoryStatus = "draft" | "polished" | "approved";

interface Story {
  id: string;
  title: string;
  summary: string;
  status: StoryStatus;
  updatedDate: string;
  wordCount: number;
  duration: string;
  tags: string[];
}

const stories: Story[] = [
  {
    id: "1",
    title: "Childhood Memories in Brooklyn",
    summary: "Growing up in 1950s Brooklyn, with stories of the neighborhood candy store and summer stickball games.",
    status: "approved",
    updatedDate: "2024-01-15",
    wordCount: 342,
    duration: "32 min",
    tags: ["childhood", "brooklyn", "1950s"],
  },
  {
    id: "2",
    title: "The War Years",
    summary: "Personal accounts from World War II, including letters from overseas and life on the home front.",
    status: "draft",
    updatedDate: "2024-01-08",
    wordCount: 156,
    duration: "45 min",
    tags: ["war", "history", "letters"],
  },
  {
    id: "3",
    title: "Family Immigration Story",
    summary: "The journey from Ellis Island to building a new life in America.",
    status: "polished",
    updatedDate: "2024-01-01",
    wordCount: 278,
    duration: "38 min",
    tags: ["immigration", "family", "america"],
  },
  {
    id: "4",
    title: "Wedding Day Memories",
    summary: "The story of how grandparents met and their wedding during the Depression era.",
    status: "approved",
    updatedDate: "2023-12-25",
    wordCount: 189,
    duration: "28 min",
    tags: ["wedding", "love", "depression"],
  },
];

export default function Stories() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState<"all" | StoryStatus>("all");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; storyId?: string }>({ open: false });
  const { toast } = useToast();
  const { stories: dbStories, loading: isLoading, updateStory, deleteStory: deleteStoryDb } = useStories();

  // Map database stories to UI format
  const mappedStories = dbStories.map(story => ({
    id: story.id,
    title: story.title || "Untitled Story",
    summary: story.edited_text?.substring(0, 150) || story.raw_text?.substring(0, 150) || "No content yet",
    status: (story.approved ? "approved" : story.edited_text ? "polished" : "draft") as StoryStatus,
    updatedDate: story.created_at || new Date().toISOString(),
    wordCount: (story.edited_text || story.raw_text || "").split(' ').length,
    duration: "N/A",
    tags: [] as string[],
  }));

  const filteredStories = mappedStories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
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
      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
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
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Story Library</h1>
            <p className="text-muted-foreground">
              Browse and manage your captured stories
            </p>
          </div>
          <Button asChild>
            <Link to="/session">
              <Plus className="w-4 h-4 mr-2" />
              New Interview
            </Link>
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

        {/* Search and View Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search stories, tags, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stories Grid/List */}
        {isLoading ? (
          <div className={`grid ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"} gap-4`}>
            {[...Array(6)].map((_, i) => (
              <StoryCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredStories.length > 0 ? (
          <div className={`grid ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"} gap-4`}>
            {filteredStories.map((story) => (
              <Card key={story.id} className="hover:shadow-md transition-shadow group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2 mb-2">{story.title}</CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(story.status)}
                        <span className="text-xs text-muted-foreground">
                          Updated {formatDate(story.updatedDate)}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-background border border-border shadow-lg z-50">
                        <DropdownMenuItem asChild>
                          <Link to={`/stories/${story.id}`} className="flex items-center">
                            <Eye className="w-4 h-4 mr-2" />
                            Open
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
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                    {story.summary}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {story.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span>{story.wordCount} words</span>
                    <span>{story.duration}</span>
                  </div>
                  <Button asChild className="w-full" size="sm">
                    <Link to={`/stories/${story.id}`}>
                      <BookOpen className="w-4 h-4 mr-2" />
                      View Story
                    </Link>
                  </Button>
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
              onClick: () => window.location.href = "/session",
            } : undefined}
          />
        )}
      </div>

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