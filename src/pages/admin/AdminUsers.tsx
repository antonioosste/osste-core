import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  Users, Search, Loader2, Check, X, CalendarIcon, Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { sendApprovedEmail } from "@/lib/emails";

interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  approved: boolean;
  beta_access_until: string | null;
  plan: string | null;
  user_type: string | null;
  created_at: string | null;
  entitlements?: any;
}

export default function AdminUsers() {
  const { toast } = useToast();
  const { permissions } = useAdminRole();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Waitlist state
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [waitlistLoading, setWaitlistLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });

    if (planFilter !== "all") query = query.eq("plan", planFilter);
    if (approvalFilter === "approved") query = query.eq("approved", true);
    else if (approvalFilter === "pending") query = query.eq("approved", false);

    const { data, error } = await query;
    if (!error && data) {
      const userIds = data.map((p: any) => p.id);
      const { data: ents } = await supabase.from("entitlements").select("*").in("user_id", userIds);
      const entMap = new Map((ents || []).map((e: any) => [e.user_id, e]));
      setUsers(data.map((p: any) => ({ ...p, entitlements: entMap.get(p.id) || null })));
    }
    setLoading(false);
  }, [planFilter, approvalFilter]);

  const fetchWaitlist = useCallback(async () => {
    const { data } = await supabase
      .from("waitlist_signups")
      .select("*")
      .order("created_at", { ascending: false });
    setWaitlist(data || []);
    setWaitlistLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); fetchWaitlist(); }, [fetchUsers, fetchWaitlist]);

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.id.includes(q));
  });

  const handleApprove = async (user: UserRow) => {
    if (!permissions.canManageUsers) return;
    setSavingId(user.id);
    try {
      const { error } = await supabase.from("profiles").update({ approved: true }).eq("id", user.id);
      if (error) throw error;

      // Log audit
      await supabase.from("admin_audit_log").insert({
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        action: "approve_user",
        target_type: "user",
        target_id: user.id,
        details: { user_email: user.email },
      });

      // Send approval email
      sendApprovedEmail({
        email: user.email || "",
        firstName: user.name?.split(" ")[0] || undefined,
        loginUrl: `${window.location.origin}/login`,
      });

      toast({ title: "User approved", description: `${user.name || user.email} has been approved.` });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSavingId(null);
  };

  const handleSuspend = async (user: UserRow) => {
    if (!permissions.canManageUsers) return;
    setSavingId(user.id);
    try {
      const { error } = await supabase.from("profiles").update({ approved: false }).eq("id", user.id);
      if (error) throw error;

      await supabase.from("admin_audit_log").insert({
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        action: "suspend_user",
        target_type: "user",
        target_id: user.id,
      });

      toast({ title: "User suspended", description: `${user.name || user.email} has been suspended.` });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSavingId(null);
  };

  const handleWaitlistAction = async (entry: any, newStatus: string) => {
    setActionLoading(entry.id);
    try {
      const { error } = await supabase.from("waitlist_signups").update({ status: newStatus }).eq("id", entry.id);
      if (error) throw error;

      if (newStatus === "approved") {
        const { data: matchingProfile } = await supabase.from("profiles").select("id, name, beta_access_until").eq("email", entry.email).maybeSingle();
        if (matchingProfile) {
          await supabase.from("profiles").update({ approved: true }).eq("id", matchingProfile.id);
        }
        sendApprovedEmail({
          email: entry.email,
          firstName: matchingProfile?.name?.split(" ")[0] || undefined,
          loginUrl: `${window.location.origin}/login`,
          betaAccessUntil: matchingProfile?.beta_access_until || undefined,
        });
      }

      toast({ title: newStatus === "approved" ? "Approved" : "Rejected", description: `${entry.email} has been ${newStatus}.` });
      fetchWaitlist();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setActionLoading(null);
  };

  const pendingWaitlist = waitlist.filter((w) => w.status === "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground">Manage users, approvals, and entitlements</p>
      </div>

      {/* Pending Waitlist Approvals */}
      {pendingWaitlist.length > 0 && (
        <Card className="border-orange-400/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Badge variant="secondary">{pendingWaitlist.length}</Badge>
              Pending Waitlist Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingWaitlist.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.email}</TableCell>
                    <TableCell className="text-muted-foreground">{entry.referral_source || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(entry.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" disabled={actionLoading === entry.id} onClick={() => handleWaitlistAction(entry, "approved")}>
                          {actionLoading === entry.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </Button>
                        <Button size="sm" variant="outline" disabled={actionLoading === entry.id} onClick={() => handleWaitlistAction(entry, "rejected")}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name, email, or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Plan" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="digital">Digital</SelectItem>
                <SelectItem value="legacy">Legacy</SelectItem>
              </SelectContent>
            </Select>
            <Select value={approvalFilter} onValueChange={setApprovalFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({filteredUsers.length})
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
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedUser(user)}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{user.name || "Unnamed"}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs">{user.plan || "free"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs">{user.user_type || "beta"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.approved ? "default" : "secondary"} className="text-xs">
                          {user.approved ? "Approved" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.created_at ? format(new Date(user.created_at), "MMM d, yyyy") : "—"}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {permissions.canManageUsers && !user.approved && (
                            <Button size="sm" variant="outline" disabled={savingId === user.id} onClick={() => handleApprove(user)}>
                              {savingId === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            </Button>
                          )}
                          {permissions.canManageUsers && user.approved && (
                            <Button size="sm" variant="outline" disabled={savingId === user.id} onClick={() => handleSuspend(user)}>
                              <X className="w-3 h-3" />
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

      {/* User Detail Dialog */}
      <UserDetailDialog user={selectedUser} onClose={() => setSelectedUser(null)} onSaved={fetchUsers} />
    </div>
  );
}

function UserDetailDialog({ user, onClose, onSaved }: { user: UserRow | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const { permissions } = useAdminRole();
  const [saving, setSaving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [betaDate, setBetaDate] = useState<string | null>(null);
  const [minutesLimit, setMinutesLimit] = useState(0);

  useEffect(() => {
    if (user) {
      setApproved(user.approved);
      setBetaDate(user.beta_access_until);
      setMinutesLimit(user.entitlements?.minutes_limit || 60);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user || !permissions.canManageUsers) return;
    setSaving(true);
    try {
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ approved, beta_access_until: betaDate })
        .eq("id", user.id);
      if (profileErr) throw profileErr;

      if (user.entitlements) {
        const { error: entErr } = await supabase
          .from("entitlements")
          .update({ minutes_limit: minutesLimit })
          .eq("user_id", user.id);
        if (entErr) throw entErr;
      }

      await supabase.from("admin_audit_log").insert({
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        action: "update_user",
        target_type: "user",
        target_id: user.id,
        details: { approved, beta_access_until: betaDate, minutes_limit: minutesLimit },
      });

      toast({ title: "Saved", description: `Updated ${user.name || user.email}.` });
      onSaved();
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  if (!user) return null;

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{user.name || "Unnamed User"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">{user.email}</div>
          <div className="text-xs font-mono text-muted-foreground">{user.id}</div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Plan</Label>
              <p className="text-foreground capitalize">{user.plan || "free"}</p>
            </div>
            <div>
              <Label className="text-sm">User Type</Label>
              <p className="text-foreground capitalize">{user.user_type || "beta"}</p>
            </div>
          </div>

          {permissions.canManageUsers && (
            <>
              <div className="flex items-center gap-3">
                <Label>Approved</Label>
                <Switch checked={approved} onCheckedChange={setApproved} />
              </div>

              <div className="flex items-center gap-3">
                <Label className="w-36 shrink-0">Beta access until</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("w-48 justify-start text-left font-normal", !betaDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {betaDate ? format(new Date(betaDate), "PPP") : "No limit"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={betaDate ? new Date(betaDate) : undefined}
                      onSelect={(d) => setBetaDate(d ? d.toISOString() : null)}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {betaDate && <Button variant="ghost" size="sm" onClick={() => setBetaDate(null)}>Clear</Button>}
              </div>

              {user.entitlements && (
                <div>
                  <Label className="text-sm">Minutes Limit</Label>
                  <Input type="number" value={minutesLimit} onChange={(e) => setMinutesLimit(parseInt(e.target.value) || 0)} className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">Used: {user.entitlements.minutes_used || 0} min</p>
                </div>
              )}

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
