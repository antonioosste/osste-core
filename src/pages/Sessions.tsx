import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Plus, Trash2, Edit, Calendar, Clock, BookOpen, Compass, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useSessions } from "@/hooks/useSessions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { assembleStory } from "@/lib/backend-api";
import { useStories } from "@/hooks/useStories";
import { SessionModeSelector } from "@/components/session/SessionModeSelector";

export default function Sessions() {
  const navigate = useNavigate();
  const { sessions, loading, deleteSession } = useSessions();
  const { session } = useAuth();
  const { toast } = useToast();
  const { refetch: refetchStories } = useStories();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [assemblingId, setAssemblingId] = useState<string | null>(null);
  const [showModeSelector, setShowModeSelector] = useState(false);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteSession(deleteId);
      setDeleteId(null);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  const formatDuration = (start: string | null, end: string | null) => {
    if (!start) return "N/A";
    if (!end) return "In Progress";
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    return `${minutes} min`;
  };

  const handleAssembleStory = async (sessionId: string) => {
    if (!session?.access_token) return;
    
    setAssemblingId(sessionId);
    try {
      toast({
        title: "Assembling story...",
        description: "Please wait while we generate your story.",
      });

      await assembleStory(session.access_token, sessionId);
      
      toast({
        title: "Story assembled",
        description: "Your story has been generated successfully!",
      });

      // Refresh stories list
      refetchStories();
    } catch (error) {
      console.error('Error assembling story:', error);
      toast({
        title: "Assembly failed",
        description: error instanceof Error ? error.message : "Failed to assemble story",
        variant: "destructive",
      });
    } finally {
      setAssemblingId(null);
    }
  };

  const handleModeSelect = (mode: 'guided' | 'non-guided', category?: string) => {
    setShowModeSelector(false);
    if (mode === 'non-guided') {
      // Non-guided: go directly to session with no category
      navigate('/session?mode=non-guided');
    } else {
      // Guided: go to session with guided mode flag
      navigate(`/session?mode=guided${category ? `&category=${category}` : ''}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      
      {/* Mode Selector Dialog */}
      <SessionModeSelector
        open={showModeSelector}
        onSelect={handleModeSelect}
        onClose={() => setShowModeSelector(false)}
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Recording Sessions</h1>
            <p className="text-muted-foreground mt-2">
              Manage your storytelling sessions
            </p>
          </div>
          <Button onClick={() => setShowModeSelector(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div>
                <EmptyState
                  icon={Calendar}
                  title="No sessions yet"
                  description="Start your first recording session to begin capturing stories"
                />
                <div className="mt-4 flex justify-center">
                  <Button asChild>
                    <Link to="/session">
                      <Plus className="w-4 h-4 mr-2" />
                      Start Recording
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        {(session as any).title || "Untitled Session"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                          {session.status || 'active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {(session as any).mode === 'non-guided' ? (
                            <>
                              <Sparkles className="w-4 h-4 text-primary" />
                              <span className="text-sm">Non-Guided</span>
                            </>
                          ) : (
                            <>
                              <Compass className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">Guided</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDuration(session.started_at, session.ended_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(session.started_at)}
                      </TableCell>
                       <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleAssembleStory(session.id)}
                            disabled={assemblingId === session.id}
                          >
                            <BookOpen className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/session?id=${session.id}`}>
                              <Edit className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setDeleteId(session.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="font-semibold text-destructive">Warning: This action cannot be undone!</p>
              <p>This will permanently delete:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>The session and all its settings</li>
                <li>All recordings and audio files</li>
                <li>All transcripts</li>
                <li>All turns and conversation history</li>
                <li>All chapters and stories</li>
                <li>All uploaded media files</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
