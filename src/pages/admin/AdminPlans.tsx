import { useState, useEffect } from "react";
import { Loader2, Plus, Pencil, Trash2, Save, X, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Plan {
  plan_name: string;
  minutes_limit: number;
  words_limit: number | null;
  pdf_enabled: boolean;
  printing_enabled: boolean;
  photo_uploads_enabled: boolean;
  archive_days: number | null;
  watermark: boolean;
}

const emptyPlan: Plan = {
  plan_name: "",
  minutes_limit: 20,
  words_limit: null,
  pdf_enabled: false,
  printing_enabled: false,
  photo_uploads_enabled: false,
  archive_days: null,
  watermark: false,
};

export default function AdminPlans() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan>(emptyPlan);
  const [isNew, setIsNew] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [inUseCount, setInUseCount] = useState<number>(0);
  const [deleting, setDeleting] = useState(false);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .order("plan_name");
    if (error) {
      toast({ title: "Error loading plans", description: error.message, variant: "destructive" });
    } else {
      setPlans(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPlans(); }, []);

  const openNew = () => {
    setEditingPlan({ ...emptyPlan });
    setIsNew(true);
    setDialogOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditingPlan({ ...plan });
    setIsNew(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingPlan.plan_name.trim()) {
      toast({ title: "Validation error", description: "Plan name is required.", variant: "destructive" });
      return;
    }
    if (editingPlan.minutes_limit < 0) {
      toast({ title: "Validation error", description: "Minutes limit must be a positive number.", variant: "destructive" });
      return;
    }
    if (isNew && plans.some((p) => p.plan_name === editingPlan.plan_name.trim())) {
      toast({ title: "Duplicate", description: "A plan with this name already exists.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      plan_name: editingPlan.plan_name.trim(),
      minutes_limit: editingPlan.minutes_limit,
      words_limit: editingPlan.words_limit,
      pdf_enabled: editingPlan.pdf_enabled,
      printing_enabled: editingPlan.printing_enabled,
      photo_uploads_enabled: editingPlan.photo_uploads_enabled,
      archive_days: editingPlan.archive_days,
      watermark: editingPlan.watermark,
    };

    const { error } = isNew
      ? await supabase.from("plans").insert(payload)
      : await supabase.from("plans").update(payload).eq("plan_name", editingPlan.plan_name);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: isNew ? "Plan created" : "Plan updated" });
      setDialogOpen(false);
      fetchPlans();
    }
    setSaving(false);
  };

  const confirmDelete = async (planName: string) => {
    const { count } = await supabase
      .from("story_groups")
      .select("id", { count: "exact", head: true })
      .eq("plan", planName);
    setInUseCount(count ?? 0);
    setDeleteTarget(planName);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("plans").delete().eq("plan_name", deleteTarget);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Plan deleted" });
      fetchPlans();
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const BoolBadge = ({ value }: { value: boolean }) => (
    <Badge variant={value ? "default" : "outline"} className="text-xs">
      {value ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
      {value ? "Yes" : "No"}
    </Badge>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plan Management</h1>
          <p className="text-muted-foreground">Manage plan definitions and feature flags</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Add Plan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plans</CardTitle>
          <CardDescription>Changes apply to new story groups via the database trigger.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan Name</TableHead>
                <TableHead className="text-center">Minutes</TableHead>
                <TableHead className="text-center">Words</TableHead>
                <TableHead className="text-center">PDF</TableHead>
                <TableHead className="text-center">Photos</TableHead>
                <TableHead className="text-center">Print</TableHead>
                <TableHead className="text-center">Watermark</TableHead>
                <TableHead className="text-center">Archive</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.plan_name}>
                  <TableCell className="font-medium capitalize">{plan.plan_name}</TableCell>
                  <TableCell className="text-center">{plan.minutes_limit}</TableCell>
                  <TableCell className="text-center">{plan.words_limit ?? "∞"}</TableCell>
                  <TableCell className="text-center"><BoolBadge value={plan.pdf_enabled} /></TableCell>
                  <TableCell className="text-center"><BoolBadge value={plan.photo_uploads_enabled} /></TableCell>
                  <TableCell className="text-center"><BoolBadge value={plan.printing_enabled} /></TableCell>
                  <TableCell className="text-center"><BoolBadge value={plan.watermark} /></TableCell>
                  <TableCell className="text-center">{plan.archive_days ? `${plan.archive_days}d` : "—"}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(plan)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => confirmDelete(plan.plan_name)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {plans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No plans found. Click "Add Plan" to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isNew ? "Create Plan" : "Edit Plan"}</DialogTitle>
            <DialogDescription>
              {isNew ? "Define a new plan with feature flags." : `Editing "${editingPlan.plan_name}"`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Plan Name</Label>
              <Input
                value={editingPlan.plan_name}
                onChange={(e) => setEditingPlan({ ...editingPlan, plan_name: e.target.value })}
                disabled={!isNew}
                placeholder="e.g. premium"
                className="mt-1"
              />
              {!isNew && <p className="text-xs text-muted-foreground mt-1">Plan name cannot be changed.</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Minutes Limit</Label>
                <Input
                  type="number"
                  min={0}
                  value={editingPlan.minutes_limit}
                  onChange={(e) => setEditingPlan({ ...editingPlan, minutes_limit: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Words Limit <span className="text-muted-foreground">(blank = unlimited)</span></Label>
                <Input
                  type="number"
                  min={0}
                  value={editingPlan.words_limit ?? ""}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      words_limit: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  className="mt-1"
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div>
              <Label>Archive Days <span className="text-muted-foreground">(blank = never)</span></Label>
              <Input
                type="number"
                min={1}
                value={editingPlan.archive_days ?? ""}
                onChange={(e) =>
                  setEditingPlan({
                    ...editingPlan,
                    archive_days: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className="mt-1"
                placeholder="Never"
              />
            </div>

            <div className="space-y-3">
              {([
                ["pdf_enabled", "PDF Download"],
                ["photo_uploads_enabled", "Photo Uploads"],
                ["printing_enabled", "Printing"],
                ["watermark", "Watermark"],
              ] as const).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm font-medium">{label}</span>
                  <Switch
                    checked={(editingPlan as any)[key]}
                    onCheckedChange={(v) => setEditingPlan({ ...editingPlan, [key]: v })}
                  />
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              {isNew ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete plan "{deleteTarget}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {inUseCount > 0
                ? `Warning: This plan is currently used by ${inUseCount} story group(s). Deleting it may cause issues for those projects.`
                : "This plan is not currently in use. It can be safely deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
