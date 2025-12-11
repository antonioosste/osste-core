import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BookOpen, Calendar, FileText, Loader2, Sparkles, ChevronDown, ChevronUp, FolderOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useChapters } from "@/hooks/useChapters";
import { useSessions } from "@/hooks/useSessions";
import { useStoryGroups } from "@/hooks/useStoryGroups";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { assembleStory } from "@/lib/backend-api";
import { useStories } from "@/hooks/useStories";
import { useState } from "react";
import { useStoryImages } from "@/hooks/useStoryImages";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function Chapters() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { chapters, loading } = useChapters();
  const { sessions } = useSessions();
  const { storyGroups } = useStoryGroups();
  const { stories } = useStories();
  const { session } = useAuth();
  const { toast } = useToast();
  const { refetch: refetchStories } = useStories();
  const [assemblingSessionId, setAssemblingSessionId] = useState<string | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  const selectedGroupId = searchParams.get('group') || 'all';

  // Helper to get chapter display title following the title hierarchy
  const getChapterDisplayTitle = (chapter: typeof chapters[0], sessionItem: typeof sessions[0] | undefined) => {
    // Priority: 1. Session title (user edited), 2. Chapter suggested_cover_title, 3. Story anchor, 4. Chapter title, 5. Fallback
    if (sessionItem?.title) return sessionItem.title;
    if (chapter.suggested_cover_title) return chapter.suggested_cover_title;
    if (sessionItem?.story_anchor) return sessionItem.story_anchor;
    if (chapter.title) return chapter.title;
    return "Untitled Chapter";
  };

  // Filter chapters by story group
  const filteredChapters = selectedGroupId === 'all'
    ? chapters
    : chapters.filter(chapter => {
        const chapterSession = sessions.find(s => s.id === chapter.session_id);
        return chapterSession?.story_group_id === selectedGroupId;
      });

  // Group chapters by session_id
  const groupedChapters = filteredChapters.reduce((acc, chapter) => {
    const key = chapter.session_id || 'unknown';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(chapter);
    return acc;
  }, {} as Record<string, typeof chapters>);

  // Get story group info
  const selectedGroup = storyGroups?.find(g => g.id === selectedGroupId);
  const groupStory = stories.find(s => s.story_group_id === selectedGroupId);
  
  // Get a session ID from this group for story generation
  const getSessionIdForGroup = () => {
    if (selectedGroupId === 'all') return null;
    const groupSessions = sessions.filter(s => s.story_group_id === selectedGroupId);
    return groupSessions[0]?.id || null;
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  const handleAssembleStory = async (sessionId: string) => {
    if (!session?.access_token) {
      toast({
        title: "Authentication required",
        description: "Please log in to generate a story.",
        variant: "destructive",
      });
      return;
    }
    
    setAssemblingSessionId(sessionId);
    try {
      toast({
        title: "Generating story...",
        description: "Please wait while we assemble your story from these chapters.",
      });

      await assembleStory(session.access_token, sessionId);
      
      toast({
        title: "Story generated successfully!",
        description: "Your story is now ready to view.",
      });

      refetchStories();
      navigate('/stories');
    } catch (error) {
      console.error('Error assembling story:', error);
      toast({
        title: "Story generation failed",
        description: error instanceof Error ? error.message : "Failed to generate story",
        variant: "destructive",
      });
    } finally {
      setAssemblingSessionId(null);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <BookOpen className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-serif font-bold text-foreground">Your Chapters</h1>
            </div>
            <p className="text-muted-foreground">
              View AI-generated chapters and create stories from your recordings
            </p>
          </div>
          
          {/* Generate Story Button for Selected Group */}
          {selectedGroupId !== 'all' && !groupStory && Object.keys(groupedChapters).length > 0 && (
            <Button 
              size="lg"
              onClick={() => {
                const sessionId = getSessionIdForGroup();
                if (sessionId) handleAssembleStory(sessionId);
              }}
              disabled={assemblingSessionId !== null}
            >
              {assemblingSessionId ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Story
                </>
              )}
            </Button>
          )}
          
          {selectedGroupId !== 'all' && groupStory && (
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate(`/stories/${groupStory.id}`)}
            >
              <BookOpen className="mr-2 h-5 w-5" />
              View Story
            </Button>
          )}
        </div>
      </div>

      {/* Filter by Book */}
      {storyGroups && storyGroups.length > 0 && (
        <div className="flex items-center gap-3 mb-6">
          <FolderOpen className="h-5 w-5 text-muted-foreground" />
          <Select 
            value={selectedGroupId} 
            onValueChange={(value) => setSearchParams(value === 'all' ? {} : { group: value })}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Filter by book" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Books</SelectItem>
              {storyGroups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedGroup && (
            <div className="text-sm text-muted-foreground">
              {Object.keys(groupedChapters).length} {Object.keys(groupedChapters).length === 1 ? 'chapter' : 'chapters'}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredChapters.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title={selectedGroupId === 'all' ? "No Chapters Yet" : "No Chapters in this Book"}
          description={selectedGroupId === 'all' 
            ? "Chapters will be generated when you complete a recording session."
            : "Complete a recording session in this book to generate chapters."
          }
          action={{
            label: "Start Recording",
            onClick: () => navigate("/session")
          }}
        />
      )}

      {!loading && filteredChapters.length > 0 && (
        <div className="space-y-8">
          {Object.entries(groupedChapters).map(([sessionId, sessionChapters]) => {
            const SessionImages = () => {
              const { images, deleteImage } = useStoryImages({ sessionId });
              
              if (images.length === 0) return null;
              
              return (
                <Card className="mb-4 border-border/40">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Session Images ({images.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {images.map((img) => (
                        <div key={img.id} className="relative rounded-lg border border-border overflow-hidden group">
                          <img 
                            src={img.url} 
                            alt={img.file_name}
                            className="w-full aspect-square object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 w-7 p-0"
                              onClick={() => deleteImage(img.id, img.storage_path)}
                            >
                              <FileText className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            };
            
            return (
              <div key={sessionId}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold text-foreground">
                      Recording Session
                    </h2>
                    <Badge variant="secondary">
                      {sessionChapters.length} {sessionChapters.length === 1 ? 'Chapter' : 'Chapters'}
                    </Badge>
                  </div>
                  <Button
                    onClick={() => handleAssembleStory(sessionId)}
                    disabled={assemblingSessionId === sessionId}
                    className="gap-2"
                  >
                    {assemblingSessionId === sessionId ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Story
                      </>
                    )}
                  </Button>
                </div>
                
                <SessionImages />

                <div className="space-y-4">
                  {sessionChapters
                    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                    .map((chapter, index) => {
                      const isExpanded = expandedChapters.has(chapter.id);
                      const sessionItem = sessions.find(s => s.id === chapter.session_id);
                      const chapterTitle = getChapterDisplayTitle(chapter, sessionItem);
                      
                      return (
                        <Collapsible key={chapter.id} open={isExpanded} onOpenChange={() => toggleChapter(chapter.id)}>
                          <Card className="border-border/40 hover:shadow-md transition-shadow">
                            <CollapsibleTrigger className="w-full">
                              <CardHeader>
                                <div className="flex items-start justify-between w-full">
                                  <div className="flex-1 text-left">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <Badge variant="outline">Chapter {index + 1}</Badge>
                                      {chapter.created_at && (
                                        <span className="text-xs text-muted-foreground flex items-center">
                                          <Calendar className="w-3 h-3 mr-1" />
                                          {new Date(chapter.created_at).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                    
                                    <CardTitle className="text-xl mb-1">
                                      {chapterTitle}
                                    </CardTitle>
                                    
                                    {chapter.summary && (
                                      <p className="text-sm text-muted-foreground line-clamp-2">
                                        {chapter.summary}
                                      </p>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-2 ml-4">
                                    <Button variant="outline" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                                      <Link to={`/chapters/${chapter.id}`}>
                                        <FileText className="w-4 h-4 mr-2" />
                                        Edit
                                      </Link>
                                    </Button>
                                    {isExpanded ? (
                                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                    ) : (
                                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent>
                              <CardContent className="space-y-4 pt-0">
                                {chapter.overall_summary && (
                                  <>
                                    <Separator />
                                    <div>
                                      <h4 className="font-semibold text-sm text-foreground mb-2">Overall Summary</h4>
                                      <p className="text-muted-foreground leading-relaxed">
                                        {chapter.overall_summary}
                                      </p>
                                    </div>
                                  </>
                                )}

                                {chapter.quotes && Array.isArray(chapter.quotes) && chapter.quotes.length > 0 && (
                                  <>
                                    <Separator />
                                    <div>
                                      <h4 className="font-semibold text-sm text-foreground mb-3">Notable Quotes</h4>
                                      <div className="space-y-2">
                                        {chapter.quotes.map((quote: any, idx: number) => (
                                          <blockquote key={idx} className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground">
                                            "{typeof quote === 'string' ? quote : quote.text}"
                                          </blockquote>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}

                                {chapter.image_hints && (
                                  <>
                                    <Separator />
                                    <div>
                                      <h4 className="font-semibold text-sm text-foreground mb-2">Image Suggestions</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {(typeof chapter.image_hints === 'string' 
                                          ? [chapter.image_hints] 
                                          : Array.isArray(chapter.image_hints) 
                                            ? chapter.image_hints 
                                            : []
                                        ).map((hint, idx) => (
                                          <Badge key={idx} variant="secondary" className="text-xs">
                                            {typeof hint === 'string' ? hint : JSON.stringify(hint)}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </CardContent>
                            </CollapsibleContent>
                          </Card>
                        </Collapsible>
                      );
                    })}
                </div>

                <Separator className="my-8" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
