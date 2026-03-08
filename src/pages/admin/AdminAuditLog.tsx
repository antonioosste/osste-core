import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ScrollText, Loader2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { AdminPagination, paginate, usePagination } from "@/components/admin/AdminPagination";

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(500);
      if (data) {
        const adminIds = [...new Set(data.map((l: any) => l.admin_id))];
        const { data: profiles } = await supabase.from("profiles").select("id, name, email").in("id", adminIds);
        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
        setLogs(data.map((l: any) => ({
          ...l,
          admin_name: profileMap.get(l.admin_id)?.name || "Unknown",
          admin_email: profileMap.get(l.admin_id)?.email || "",
        })));
      }
      setLoading(false);
    }
    fetch();
  }, []);

  const filtered = logs.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.action?.toLowerCase().includes(q) || l.admin_name?.toLowerCase().includes(q) || l.admin_email?.toLowerCase().includes(q) || l.target_type?.toLowerCase().includes(q);
  });

  const { totalPages, pageSize, totalItems } = usePagination(filtered, 25);
  const paged = paginate(filtered, page, 25);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
        <p className="text-muted-foreground">Track all admin actions</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by action, admin, or target type..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ScrollText className="h-5 w-5" /> Recent Actions ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
          ) : logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No audit events recorded yet.</p>
          ) : (
            <>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((log) => (
                      <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedLog(log)}>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{log.admin_name}</p>
                            <p className="text-xs text-muted-foreground">{log.admin_email}</p>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{log.action.replace(/_/g, " ")}</Badge></TableCell>
                        <TableCell className="text-sm">
                          {log.target_type && <span className="text-muted-foreground">{log.target_type}: </span>}
                          <span className="font-mono text-xs">{log.target_id?.slice(0, 8) || "—"}</span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {log.details ? JSON.stringify(log.details).slice(0, 80) : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.created_at), "MMM d, HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={pageSize} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Audit Event Detail</DialogTitle></DialogHeader>
          {selectedLog && (
            <div className="space-y-3 text-sm">
              <div><strong>Admin:</strong> {selectedLog.admin_name} ({selectedLog.admin_email})</div>
              <div><strong>Action:</strong> {selectedLog.action}</div>
              <div><strong>Target:</strong> {selectedLog.target_type || "—"} / {selectedLog.target_id || "—"}</div>
              <div><strong>Time:</strong> {format(new Date(selectedLog.created_at), "PPpp")}</div>
              {selectedLog.details && (
                <div>
                  <strong>Details:</strong>
                  <pre className="mt-1 bg-muted/50 rounded-md p-3 text-xs overflow-auto max-h-60">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
