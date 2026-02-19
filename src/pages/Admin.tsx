import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Lock, Users, ClipboardList, Loader2, Check, X, CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Header } from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface WaitlistEntry {
  id: string;
  email: string;
  status: string;
  created_at: string;
  referral_source: string | null;
}

interface UserRow {
  id: string;
  name: string | null;
  approved: boolean;
  beta_access_until: string | null;
  plan: string | null;
  created_at: string | null;
  email?: string;
  entitlements?: {
    id: string;
    minutes_limit: number;
    minutes_used: number;
    tokens_limit: number;
    max_books: number;
    can_record: boolean;
    can_generate_book: boolean;
    can_download_pdf: boolean;
  } | null;
}

export default function Admin() {
  const { toast } = useToast();
  const { isAdmin, loading } = useAdminRole();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header isAuthenticated={true} />
        <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
          <p className="text-muted-foreground">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header isAuthenticated={true} />
        <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mx-auto mb-6">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Admin Access Only</h1>
          <p className="text-lg text-muted-foreground mb-8">
            You need administrator privileges to access this area.
          </p>
          <Button className="w-full" onClick={() => window.location.href = "/dashboard"}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage waitlist and user access</p>
        </div>

        <Tabs defaultValue="waitlist" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="waitlist" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" /> Waitlist
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" /> Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="waitlist">
            <WaitlistTab />
          </TabsContent>
          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ─── WAITLIST TAB ─── */
function WaitlistTab() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from("waitlist_signups")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setEntries(data as WaitlistEntry[]);
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleAction = async (entry: WaitlistEntry, newStatus: string) => {
    setActionLoading(entry.id);
    try {
      // Update waitlist signup status
      const { error } = await supabase
        .from("waitlist_signups")
        .update({ status: newStatus })
        .eq("id", entry.id);
      if (error) throw error;

      // If approving, also set profiles.approved = true for any matching profile
      if (newStatus === "approved") {
        const { data: matchingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", entry.email)
          .maybeSingle();

        if (matchingProfile) {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({ approved: true })
            .eq("id", matchingProfile.id);
          if (profileError) throw profileError;
        }
        // If no profile exists yet, the handle_new_user() trigger will
        // auto-approve on signup since waitlist_signups.status = 'approved'
      }

      toast({
        title: newStatus === "approved" ? "Approved" : "Rejected",
        description: `${entry.email} has been ${newStatus}.${
          newStatus === "approved" ? " They can now sign up or log in." : ""
        }`,
      });
      fetchEntries();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setActionLoading(null);
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading waitlist...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5" />
          Waitlist Entries ({entries.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Signed Up</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">{entry.email}</TableCell>
                <TableCell>
                  <Badge variant={
                    entry.status === "approved" ? "default" :
                    entry.status === "rejected" ? "destructive" : "secondary"
                  }>
                    {entry.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{entry.referral_source || "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(entry.created_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  {entry.status === "pending" && (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading === entry.id}
                        onClick={() => handleAction(entry, "approved")}
                      >
                        {actionLoading === entry.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading === entry.id}
                        onClick={() => handleAction(entry, "rejected")}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No waitlist entries yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* ─── USERS TAB ─── */
function UsersTab() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, Partial<UserRow & { entitlements: any }>>>({});

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) { setLoading(false); return; }

    // Fetch entitlements for all users
    const userIds = data.map((p: any) => p.id);
    const { data: ents } = await supabase
      .from("entitlements")
      .select("*")
      .in("user_id", userIds);

    const entMap = new Map((ents || []).map((e: any) => [e.user_id, e]));

    setUsers(data.map((p: any) => ({
      ...p,
      entitlements: entMap.get(p.id) || null,
    })));
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const getEdit = (userId: string) => edits[userId] || {};

  const updateEdit = (userId: string, field: string, value: any) => {
    setEdits(prev => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: value }
    }));
  };

  const handleSave = async (user: UserRow) => {
    setSavingId(user.id);
    const edit = getEdit(user.id);
    try {
      // Update profile fields
      const profileUpdate: any = {};
      if (edit.approved !== undefined) profileUpdate.approved = edit.approved;
      if (edit.beta_access_until !== undefined) profileUpdate.beta_access_until = edit.beta_access_until;

      if (Object.keys(profileUpdate).length > 0) {
        const { error } = await supabase
          .from("profiles")
          .update(profileUpdate)
          .eq("id", user.id);
        if (error) throw error;
      }

      // Update entitlements
      const entEdit = edit.entitlements;
      if (entEdit && user.entitlements) {
        const { error } = await supabase
          .from("entitlements")
          .update(entEdit)
          .eq("user_id", user.id);
        if (error) throw error;
      }

      toast({ title: "Saved", description: `Updated settings for ${user.name || user.id}.` });
      setEdits(prev => { const n = { ...prev }; delete n[user.id]; return n; });
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSavingId(null);
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading users...</div>;

  return (
    <div className="space-y-4">
      {users.map((user) => {
        const edit = getEdit(user.id);
        const ent = { ...user.entitlements, ...edit.entitlements };
        const isApproved = edit.approved !== undefined ? edit.approved : user.approved;
        const betaDate = edit.beta_access_until !== undefined
          ? edit.beta_access_until
          : user.beta_access_until;
        const hasChanges = Object.keys(edit).length > 0;

        return (
          <Card key={user.id}>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{user.name || "Unnamed"}</p>
                    <p className="text-sm text-muted-foreground">{user.id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`approved-${user.id}`} className="text-sm">Approved</Label>
                      <Switch
                        id={`approved-${user.id}`}
                        checked={isApproved}
                        onCheckedChange={(v) => updateEdit(user.id, "approved", v)}
                      />
                    </div>
                    <Button
                      size="sm"
                      disabled={!hasChanges || savingId === user.id}
                      onClick={() => handleSave(user)}
                    >
                      {savingId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                    </Button>
                  </div>
                </div>

                {/* Beta access date */}
                <div className="flex items-center gap-3">
                  <Label className="text-sm w-36 shrink-0">Beta access until</Label>
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
                        onSelect={(d) => updateEdit(user.id, "beta_access_until", d ? d.toISOString() : null)}
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  {betaDate && (
                    <Button variant="ghost" size="sm" onClick={() => updateEdit(user.id, "beta_access_until", null)}>
                      Clear
                    </Button>
                  )}
                </div>

                {/* Entitlements grid */}
                {user.entitlements && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pt-2 border-t">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Minutes limit</Label>
                      <Input
                        type="number"
                        value={ent.minutes_limit ?? ""}
                        onChange={(e) => updateEdit(user.id, "entitlements", { ...edit.entitlements, minutes_limit: parseInt(e.target.value) || 0 })}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Minutes used</Label>
                      <Input
                        type="number"
                        value={ent.minutes_used ?? ""}
                        disabled
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Tokens limit</Label>
                      <Input
                        type="number"
                        value={ent.tokens_limit ?? ""}
                        onChange={(e) => updateEdit(user.id, "entitlements", { ...edit.entitlements, tokens_limit: parseInt(e.target.value) || 0 })}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Max books</Label>
                      <Input
                        type="number"
                        value={ent.max_books ?? ""}
                        onChange={(e) => updateEdit(user.id, "entitlements", { ...edit.entitlements, max_books: parseInt(e.target.value) || 0 })}
                        className="h-8"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={ent.can_record ?? true}
                        onCheckedChange={(v) => updateEdit(user.id, "entitlements", { ...edit.entitlements, can_record: v })}
                      />
                      <Label className="text-xs">Can record</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={ent.can_generate_book ?? false}
                        onCheckedChange={(v) => updateEdit(user.id, "entitlements", { ...edit.entitlements, can_generate_book: v })}
                      />
                      <Label className="text-xs">Can generate</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={ent.can_download_pdf ?? false}
                        onCheckedChange={(v) => updateEdit(user.id, "entitlements", { ...edit.entitlements, can_download_pdf: v })}
                      />
                      <Label className="text-xs">Can download PDF</Label>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
      {users.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No users found.</p>
      )}
    </div>
  );
}
