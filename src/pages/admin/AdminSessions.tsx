import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Mic, Loader2, Search, Trash2, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";

interface SessionRow {
  id: string;
  title: string | null;
  user_id: string;
  status: string | null;
  mode: string | null;
  started_at: string | null;
  ended_at: string | null;
  summary: string | null;
  story_group_id: string | null;
  profile?: { name: string | null; email: string | null };
  recording_count?: number;
  total_duration?: number;
}

export default function AdminSessions() {
  const { toast } = useToast();
  const { permissions } = useAdminRole();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSession, setSelectedSession] = useState<SessionRow | null>(null);

  useEffect(() => {
    async function fetchSessions() {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(200);

      if (!error && data) {
        // Fetch profiles for user names
        const userIds = [...new Set(data.map((s: any) => s.user_id))];
        const { data: profiles } = await supabase.from("profiles").select("id, name, email").in("id", userIds);
        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

        // Fetch recording stats
        const sessionIds = data.map((s: any) => s.id);
        const { data: recordings } = await supabase.from("recordings").select("session_id, duration_seconds").in("session_id", sessionIds);

        const recMap = new Map<string, { count: number; duration: number }>();
        (recordings || []).forEach((r: any) => {
          const existing = recMap.get(r.session_id) || { count: 0, duration: 0 };
          recMap.set(r.session_id, { count: existing.count + 1, duration: existing.duration + (r.duration_seconds || 0) });
        });

        setSessions(data.map((s: any) => ({
          ...s,
          profile: profileMap.get(s.user_id),
          recording_count: recMap.get(s.id)?.count || 0,
          total_duration: recMap.get(s.id)?.duration || 0,
        })));
      }
      setLoading(false);
    }

    fetchSessions();
  }, []);

  const filtered = sessions.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.title?.toLowerCase().includes(q) ||
      s.profile?.name?.toLowerCase().includes(q) ||
      s.profile?.email?.toLowerCase().includes(q) ||
      s.id.includes(q)
    );
  });

  const handleDelete = async (session: SessionRow) => {
    if (!permissions.canManageSessions) return;
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) throw new Error("Not authenticated");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const resp = await fetch(`https://${projectId}.supabase.co/functions/v1/delete-session-deep`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({ session_id: session.id }),
      });

      if (!resp.ok) throw new Error("Failed to delete session");

      toast({ title: "Deleted", description: `Session "${session.title || session.id}" deleted.` });
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sessions Management</h1>
        <p className="text-muted-foreground">View and manage all voice sessions</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by title, user, or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Sessions ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Recordings</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium text-sm max-w-[200px] truncate">
                        {session.title || "Untitled"}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{session.profile?.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{session.profile?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{session.recording_count}</TableCell>
                      <TableCell className="text-sm">{formatDuration(session.total_duration || 0)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{session.status || "active"}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {session.started_at ? format(new Date(session.started_at), "MMM d, yyyy") : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setSelectedSession(session)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          {permissions.canManageSessions && (
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(session)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Detail Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={(open) => !open && setSelectedSession(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedSession?.title || "Untitled Session"}</DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-3 text-sm">
              <div><strong>ID:</strong> <span className="font-mono text-xs">{selectedSession.id}</span></div>
              <div><strong>User:</strong> {selectedSession.profile?.name} ({selectedSession.profile?.email})</div>
              <div><strong>Mode:</strong> {selectedSession.mode || "guided"}</div>
              <div><strong>Status:</strong> {selectedSession.status || "active"}</div>
              <div><strong>Recordings:</strong> {selectedSession.recording_count}</div>
              <div><strong>Duration:</strong> {formatDuration(selectedSession.total_duration || 0)}</div>
              {selectedSession.summary && (
                <div>
                  <strong>Summary:</strong>
                  <p className="mt-1 text-muted-foreground">{selectedSession.summary}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
