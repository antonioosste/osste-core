import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { Plus, Clock, Calendar, Compass, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessions } from "@/hooks/useSessions";
import { useStoryGroups } from "@/hooks/useStoryGroups";
import { useChapters } from "@/hooks/useChapters";
import { getChapterDisplayTitle } from "@/lib/chapterTitle";
import { EmptyState } from "@/components/empty-states/EmptyState";

export function MobileSessions() {
  const navigate = useNavigate();
  const { sessions, loading, deleteSession } = useSessions();
  const { storyGroups } = useStoryGroups();
  const { chapters } = useChapters();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const getGroupName = (groupId?: string) => {
    if (!groupId) return "Ungrouped";
    return storyGroups?.find((g) => g.id === groupId)?.title || "Unknown";
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatDuration = (start: string | null, end: string | null) => {
    if (!start) return "N/A";
    if (!end) return "In Progress";
    const mins = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60000);
    return `${mins} min`;
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteSession(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="px-5 pt-safe-top">
      {/* Header */}
      <div className="flex items-center justify-between pt-10 pb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Sessions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your recording sessions</p>
        </div>
        <Button size="sm" className="rounded-xl h-10 gap-1.5" onClick={() => navigate("/session")}>
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No sessions yet"
          description="Start your first recording"
          action={{ label: "Start Recording", onClick: () => navigate("/session") }}
        />
      ) : (
        <div className="space-y-3 pb-4">
          {sessions.map((session) => {
            const chapterData = chapters.find((ch) => ch.session_id === session.id);
            const title = getChapterDisplayTitle(session, chapterData);
            const isActive = session.status === "active" || !session.ended_at;

            return (
              <Card
                key={session.id}
                className="border-border/40 cursor-pointer active:scale-[0.98] transition-transform overflow-hidden"
                onClick={() => navigate(`/session?id=${session.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-1 flex-1">
                      {title}
                    </h3>
                    <Badge
                      variant={isActive ? "secondary" : "default"}
                      className="shrink-0 text-[10px] px-2 py-0.5"
                    >
                      {isActive ? "Active" : "Done"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="truncate max-w-[100px]">{getGroupName(session.story_group_id)}</span>
                    <span className="flex items-center gap-1">
                      {(session as any).mode === "non-guided" ? (
                        <Sparkles className="h-3 w-3" />
                      ) : (
                        <Compass className="h-3 w-3" />
                      )}
                      {(session as any).mode === "non-guided" ? "Free" : "Guided"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(session.started_at, session.ended_at)}
                    </span>
                    <span>{formatDate(session.started_at)}</span>
                  </div>
                  {/* Swipe-to-delete hint — using long press for now */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(session.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="mx-4 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the session and all recordings, transcripts, and chapters.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground rounded-xl">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
