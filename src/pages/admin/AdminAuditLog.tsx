import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ScrollText, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (data) {
        // Fetch admin names
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
        <p className="text-muted-foreground">Track all admin actions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" /> Recent Actions ({logs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
          ) : logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No audit events recorded yet.</p>
          ) : (
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
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{log.admin_name}</p>
                          <p className="text-xs text-muted-foreground">{log.admin_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{log.action.replace(/_/g, " ")}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.target_type && (
                          <span className="text-muted-foreground">{log.target_type}: </span>
                        )}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
