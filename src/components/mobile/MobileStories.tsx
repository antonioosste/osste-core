import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Search, Feather } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { StoryCardSkeleton } from "@/components/loaders/StoryCardSkeleton";
import { useStories } from "@/hooks/useStories";
import { useStoryGroups } from "@/hooks/useStoryGroups";

export function MobileStories() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { stories: dbStories, loading } = useStories();
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
      summary: s.edited_text?.substring(0, 100) || s.raw_text?.substring(0, 100) || "",
      date: s.created_at || new Date().toISOString(),
    };
  });

  const filtered = mappedStories.filter(
    (s) =>
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="px-5 pt-safe-top">
      {/* Header */}
      <div className="pt-10 pb-4">
        <h1 className="text-2xl font-serif font-bold text-foreground">Stories</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your written stories</p>
      </div>

      {/* Search — only show when there are stories */}
      {dbStories.length > 3 && (
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-11 rounded-xl"
          />
        </div>
      )}

      {/* Story List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <StoryCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 animate-fade-in">
          <Feather className="h-12 w-12 text-muted-foreground/25 mb-4" />
          <p className="text-base font-medium text-foreground mb-1">
            {searchTerm ? "No stories found" : "No stories yet"}
          </p>
          <p className="text-sm text-muted-foreground max-w-[240px] leading-relaxed">
            {searchTerm
              ? "Try a different search"
              : "Record a session and your stories will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-2 pb-4">
          {filtered.map((story) => (
            <button
              key={story.id}
              className="flex items-start gap-3 w-full p-4 rounded-xl active:bg-muted/50 transition-colors text-left"
              onClick={() => navigate(`/books/${story.storyGroupId || ""}`)}
            >
              <div className="h-9 w-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                <BookOpen className="h-4 w-4 text-primary/70" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-1">{story.title}</p>
                {story.summary && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                    {story.summary}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
