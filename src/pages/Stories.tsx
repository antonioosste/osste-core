import { useState } from "react";
import { Search, Filter, Grid, List, Plus, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { StoryCardSkeleton } from "@/components/loaders/StoryCardSkeleton";

const stories = [
  {
    id: "1",
    title: "Childhood Memories in Brooklyn",
    summary: "Growing up in 1950s Brooklyn, with stories of the neighborhood candy store and summer stickball games.",
    status: "published",
    date: "2 days ago",
    duration: "32 min",
    tags: ["childhood", "brooklyn", "1950s"],
  },
  {
    id: "2",
    title: "The War Years",
    summary: "Personal accounts from World War II, including letters from overseas and life on the home front.",
    status: "draft",
    date: "1 week ago", 
    duration: "45 min",
    tags: ["war", "history", "letters"],
  },
  {
    id: "3",
    title: "Family Immigration Story",
    summary: "The journey from Ellis Island to building a new life in America.",
    status: "published",
    date: "2 weeks ago",
    duration: "38 min", 
    tags: ["immigration", "family", "america"],
  },
  {
    id: "4",
    title: "Wedding Day Memories",
    summary: "The story of how grandparents met and their wedding during the Depression era.",
    status: "published",
    date: "3 weeks ago",
    duration: "28 min",
    tags: ["wedding", "love", "depression"],
  },
];

export default function Stories() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredStories = stories.filter(story =>
    story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    story.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    story.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
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

        {/* Search and Filters */}
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
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
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

        {/* Tabs */}
        <Tabs defaultValue="all" className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All Stories ({stories.length})</TabsTrigger>
            <TabsTrigger value="published">Published ({stories.filter(s => s.status === "published").length})</TabsTrigger>
            <TabsTrigger value="drafts">Drafts ({stories.filter(s => s.status === "draft").length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {isLoading ? (
              <div className={`grid ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"} gap-4`}>
                {[...Array(6)].map((_, i) => (
                  <StoryCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredStories.length > 0 ? (
              <div className={`grid ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"} gap-4`}>
                {filteredStories.map((story) => (
                  <Card key={story.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg line-clamp-2">{story.title}</CardTitle>
                        <Badge variant={story.status === "published" ? "default" : "secondary"}>
                          {story.status}
                        </Badge>
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
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          {story.duration} • {story.date}
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/stories/${story.id}`}>View</Link>
                        </Button>
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
                  onClick: () => window.location.href = "/session",
                } : undefined}
              />
            )}
          </TabsContent>

          <TabsContent value="published" className="mt-6">
            {/* Similar structure for published stories */}
            <div className={`grid ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"} gap-4`}>
              {filteredStories.filter(s => s.status === "published").map((story) => (
                <Card key={story.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{story.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4">
                      {story.summary}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {story.duration} • {story.date}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/stories/${story.id}`}>View</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="drafts" className="mt-6">
            {/* Similar structure for draft stories */}
            <div className={`grid ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"} gap-4`}>
              {filteredStories.filter(s => s.status === "draft").map((story) => (
                <Card key={story.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{story.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4">
                      {story.summary}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {story.duration} • {story.date}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/stories/${story.id}`}>Edit</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}