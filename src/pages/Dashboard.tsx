import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  Mic, 
  BookOpen, 
  Play, 
  ArrowRight,
  Crown,
  FileAudio,
  Plus,
  FolderOpen,
  Sparkles,
  ChevronRight,
  Trash2
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
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [isAllBooksDialogOpen, setIsAllBooksDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const userPaid = profile?.plan !== 'free';
  
  // Calculate stats
  const totalSessions = sessions.length;
  const totalStories = stories.length;
  
  // Calculate total minutes recorded
  const totalMinutesRecorded = recordings.reduce((acc, recording) => {
    return acc + (recording.duration_seconds || 0);
  }, 0) / 60;
  
  // Define total minutes available based on plan
  const totalMinutesAvailable = userPaid ? 999999 : 30; // Unlimited for paid, 30 for free
  
  // Find active session
  const activeSession = sessions.find(s => s.status === 'active' || !s.ended_at);

  // Get session count per story group
  const getSessionCount = (groupId: string) => {
    return sessions.filter(s => s.story_group_id === groupId).length;
  };

  // Get story for a group
  const getGroupStory = (groupId: string) => {
    return stories.find(s => s.story_group_id === groupId);
  };

  const handleCreateGroup = async () => {
    if (!newGroupTitle.trim()) return;
    
    try {
      await createStoryGroup(newGroupTitle.trim(), newGroupDescription.trim() || undefined);
      setIsCreateDialogOpen(false);
      setNewGroupTitle('');
      setNewGroupDescription('');
    } catch (error) {
      console.error('Failed to create story group:', error);
    }
  };

  const handleDeleteGroup = async () => {
    if (!deleteGroupId) return;
    
    try {
      await deleteStoryGroup(deleteGroupId);
      setDeleteGroupId(null);
    } catch (error) {
      console.error('Failed to delete story group:', error);
    }
  };

  const handleRequestPrintCopy = (bookTitle: string) => {
    toast({
      title: "Print Request",
      description: `Your request for "${bookTitle}" has been submitted. We'll contact you shortly with pricing and shipping details.`,
    });
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
                  Start a new book project. You can add multiple chapters through recording sessions to build your complete story.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Book Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., My Family Story, My Career Journey, Travel Adventures"
                    value={newGroupTitle}
                    onChange={(e) => setNewGroupTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="What will this book be about?"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateGroup} disabled={!newGroupTitle.trim()}>
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
        <Card className="border-border/40 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Mic className="h-8 w-8 text-primary/70" />
              <span className="text-3xl font-bold text-foreground">{totalSessions}</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Recording Sessions</p>
          </CardContent>
        </Card>
        
        <Card className="border-border/40 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <FileAudio className="h-8 w-8 text-primary/70" />
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

        <Card className="border-border/40 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setIsAllBooksDialogOpen(true)}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="h-8 w-8 text-primary/70" />
              <span className="text-3xl font-bold text-foreground">{storyGroups?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Books Created</p>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
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
            {storyGroups.map((group) => {
              const sessionCount = getSessionCount(group.id);
              const groupStory = getGroupStory(group.id);
              
              return (
                <Card key={group.id} className="border-border/40 hover:shadow-md transition-shadow group">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-5 w-5 text-primary" />
                        <Badge variant={groupStory ? "default" : "secondary"}>
                          {sessionCount} {sessionCount === 1 ? 'chapter' : 'chapters'}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteGroupId(group.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle className="line-clamp-1 text-foreground">{group.title}</CardTitle>
                    {group.description && (
                      <CardDescription className="line-clamp-2">
                        {group.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      size="sm" 
                      className="w-full"
                      variant="outline"
                      onClick={() => navigate(`/chapters?group=${group.id}`)}
                    >
                      View Chapters
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                    
                    {sessionCount > 0 && !groupStory && (
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => navigate(`/chapters?group=${group.id}`)}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Story
                      </Button>
                    )}
                    
                    {groupStory && (
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => navigate(`/stories/${groupStory.id}`)}
                      >
                        <BookOpen className="mr-2 h-4 w-4" />
                        View Story
                      </Button>
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

      {/* Continue Active Session */}
      {activeSession && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Continue Your Active Session</h3>
                <p className="text-muted-foreground">
                  {(activeSession as any).title || "Untitled Session"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Started {activeSession.started_at ? new Date(activeSession.started_at).toLocaleDateString() : 'recently'}
                </p>
              </div>
              <Button onClick={() => navigate(`/session?id=${activeSession.id}`)}>
                <Play className="w-4 h-4 mr-2" />
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deleteGroupId} onOpenChange={() => setDeleteGroupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this book and all its chapters. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup}>Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isAllBooksDialogOpen} onOpenChange={setIsAllBooksDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Your Books</DialogTitle>
            <DialogDescription>
              View all your books and request print copies
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {storyGroups && storyGroups.length > 0 ? (
              storyGroups.map((group) => {
                const sessionCount = getSessionCount(group.id);
                const groupStory = getGroupStory(group.id);
                
                return (
                  <Card key={group.id} className="border-border/40">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FolderOpen className="h-5 w-5 text-primary" />
                            <Badge variant={groupStory ? "default" : "secondary"}>
                              {sessionCount} {sessionCount === 1 ? 'chapter' : 'chapters'}
                            </Badge>
                          </div>
                          <CardTitle className="text-foreground">{group.title}</CardTitle>
                          {group.description && (
                            <CardDescription className="mt-2">
                              {group.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setIsAllBooksDialogOpen(false);
                          navigate(`/chapters?group=${group.id}`);
                        }}
                      >
                        View Chapters
                      </Button>
                      {groupStory && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setIsAllBooksDialogOpen(false);
                              navigate(`/stories/${groupStory.id}`);
                            }}
                          >
                            View Story
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleRequestPrintCopy(group.title)}
                          >
                            Request Print Copy
                          </Button>
                        </>
                      )}
                      {!groupStory && sessionCount > 0 && (
                        <Button 
                          size="sm" 
                          onClick={() => {
                            setIsAllBooksDialogOpen(false);
                            navigate(`/chapters?group=${group.id}`);
                          }}
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Story
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No books created yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
