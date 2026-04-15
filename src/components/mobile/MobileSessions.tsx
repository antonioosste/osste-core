import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Plus, Clock, Play, Mic, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    if (!groupId) return null;
    return storyGroups?.find((g) => g.id === groupId)?.title || null;
  };

  const formatDuration = (start: string | null, end: string | null) => {
    if (!start) return "";
    if (!end) return "In Progress";
    const mins = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60000);
    return `${mins} min`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteSession(deleteId);
      setDeleteId(null);
    }
  };

  const activeSessions = sessions.filter((s) => s.status === "active" || !s.ended_at);
  const completedSessions = sessions.filter((s) => s.status !== "active" && s.ended_at);

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

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={Mic}
          title="No sessions yet"
          description="Start recording and your sessions will appear here"
          action={{ label: "Start Recording", onClick: () => navigate("/session") }}
        />
      ) : (
        <div className="space-y-4 pb-4">
          {/* Active sessions */}
          {activeSessions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Continue</p>
              {activeSessions.map((session) => {
                const chapterData = chapters.find((ch) => ch.session_id === session.id);
                const title = getChapterDisplayTitle(session, chapterData);

                return (
                  <Card
                    key={session.id}
                    className="border-primary/20 bg-primary/5 cursor-pointer active:scale-[0.98] transition-transform"
                    onClick={() => navigate(`/session?id=${session.id}`)}
                  >
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Play className="h-4 w-4 text-primary ml-0.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground line-clamp-1">{title}</p>
                        <p className="text-xs text-muted-foreground">
                          {getGroupName(session.story_group_id) || "Tap to continue recording"}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Completed sessions */}
          {completedSessions.length > 0 && (
            <div className="space-y-2">
              {activeSessions.length > 0 && (
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-2">Past</p>
              )}
              {completedSessions.map((session) => {
                const chapterData = chapters.find((ch) => ch.session_id === session.id);
                const title = getChapterDisplayTitle(session, chapterData);
                const duration = formatDuration(session.started_at, session.ended_at);
                const date = formatDate(session.started_at);

                return (
                  <button
                    key={session.id}
                    className="flex items-center gap-3 w-full p-3 rounded-xl active:bg-muted/50 transition-colors text-left"
                    onClick={() => navigate(`/session?id=${session.id}`)}
                  >
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Mic className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{title}</p>
                      <p className="text-xs text-muted-foreground">
                        {[duration, date].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
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
