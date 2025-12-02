import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Plus, Trash2, Edit, Calendar, Clock, Compass, Sparkles, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSessions } from "@/hooks/useSessions";
import { useStoryGroups } from "@/hooks/useStoryGroups";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-states/EmptyState";

export default function Sessions() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { sessions, loading, deleteSession } = useSessions();
  const { storyGroups } = useStoryGroups();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const selectedGroupId = searchParams.get('group') || 'all';

  // Filter sessions by story group
  const filteredSessions = selectedGroupId === 'all' 
    ? sessions 
    : sessions.filter(s => s.story_group_id === selectedGroupId);

  // Get story group name
  const getGroupName = (groupId?: string) => {
    if (!groupId) return 'Ungrouped';
    const group = storyGroups?.find(g => g.id === groupId);
    return group?.title || 'Unknown Group';
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteSession(deleteId);
      setDeleteId(null);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatDuration = (start: string | null, end: string | null) => {
    if (!start) return "N/A";
    if (!end) return "In Progress";
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    return `${minutes} min`;
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Recording Sessions</h1>
          <p className="text-muted-foreground">
            Manage your storytelling sessions
          </p>
        </div>
        <Button onClick={() => navigate('/session')} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          New Session
        </Button>
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
        </div>
      )}

      {loading ? (
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={selectedGroupId === 'all' ? "No sessions yet" : "No sessions in this project"}
          description={selectedGroupId === 'all' 
            ? "Start your first recording session to begin capturing stories"
            : "Start a new recording session for this story project"
          }
          action={{
            label: "Start Recording",
            onClick: () => navigate('/session')
          }}
        />
      ) : (
        <div className="grid gap-4">
          {filteredSessions.map((session) => (
            <Card key={session.id} className="border-border/40 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-foreground">
                        {(session as any).title || "Untitled Session"}
                      </h3>
                      <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
                        {session.status || 'active'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <FolderOpen className="w-4 h-4 text-primary" />
                        <span>{getGroupName(session.story_group_id)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {(session as any).mode === 'non-guided' ? (
                          <>
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span>Non-Guided</span>
                          </>
                        ) : (
                          <>
                            <Compass className="w-4 h-4" />
                            <span>Guided</span>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {formatDuration(session.started_at, session.ended_at)}
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {formatDate(session.started_at)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/session?id=${session.id}`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
