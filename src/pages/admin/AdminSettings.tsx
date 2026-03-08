import { useState, useEffect } from "react";
import { Settings, Info, Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";

interface SettingsMap {
  [key: string]: any;
}

export default function AdminSettings() {
  const { toast } = useToast();
  const { permissions } = useAdminRole();
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable local state
  const [betaMode, setBetaMode] = useState(true);
  const [autoApproval, setAutoApproval] = useState(false);
  const [freeMinutes, setFreeMinutes] = useState(20);
  const [digitalMinutes, setDigitalMinutes] = useState(60);
  const [legacyMinutes, setLegacyMinutes] = useState(120);
  const [sessionLimit, setSessionLimit] = useState(0);

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase.from("system_settings").select("*");
      if (data) {
        const map: SettingsMap = {};
        data.forEach((s: any) => { map[s.key] = JSON.parse(JSON.stringify(s.value)); });
        setSettings(map);
        setBetaMode(map.beta_mode === "enabled");
        setAutoApproval(map.auto_approval === "enabled");
        setFreeMinutes(typeof map.free_recording_minutes === "number" ? map.free_recording_minutes : 20);
        setDigitalMinutes(typeof map.digital_recording_minutes === "number" ? map.digital_recording_minutes : 60);
        setLegacyMinutes(typeof map.legacy_recording_minutes === "number" ? map.legacy_recording_minutes : 120);
        setSessionLimit(typeof map.session_duration_limit === "number" ? map.session_duration_limit : 0);
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Not authenticated");

      const updates = [
        { key: "beta_mode", value: JSON.stringify(betaMode ? "enabled" : "disabled") },
        { key: "auto_approval", value: JSON.stringify(autoApproval ? "enabled" : "disabled") },
        { key: "free_recording_minutes", value: JSON.stringify(freeMinutes) },
        { key: "digital_recording_minutes", value: JSON.stringify(digitalMinutes) },
        { key: "legacy_recording_minutes", value: JSON.stringify(legacyMinutes) },
        { key: "session_duration_limit", value: JSON.stringify(sessionLimit) },
      ];

      for (const u of updates) {
        const { error } = await supabase.from("system_settings")
          .update({ value: JSON.parse(u.value), updated_at: new Date().toISOString(), updated_by: user.id })
          .eq("key", u.key);
        if (error) throw error;
      }

      await supabase.from("admin_audit_log").insert({
        admin_id: user.id,
        action: "update_system_settings",
        target_type: "system",
        details: { beta_mode: betaMode, auto_approval: autoApproval, free_recording_minutes: freeMinutes, digital_recording_minutes: digitalMinutes, legacy_recording_minutes: legacyMinutes, session_duration_limit: sessionLimit },
      });

      toast({ title: "Settings saved", description: "System settings have been updated." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
        <p className="text-muted-foreground">Platform configuration (owner only)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Platform Settings</CardTitle>
          <CardDescription>Changes are saved immediately and logged to the audit trail.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium text-sm">Beta Mode</p>
                <p className="text-xs text-muted-foreground">New users require admin approval</p>
              </div>
              <Switch checked={betaMode} onCheckedChange={setBetaMode} disabled={!permissions.canManageSettings} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium text-sm">Auto-Approval</p>
                <p className="text-xs text-muted-foreground">Automatically approve new signups</p>
              </div>
              <Switch checked={autoApproval} onCheckedChange={setAutoApproval} disabled={!permissions.canManageSettings} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Free Plan Minutes</Label>
              <Input type="number" value={freeMinutes} onChange={(e) => setFreeMinutes(Number(e.target.value))} disabled={!permissions.canManageSettings} className="mt-1" />
            </div>
            <div>
              <Label>Digital Plan Minutes</Label>
              <Input type="number" value={digitalMinutes} onChange={(e) => setDigitalMinutes(Number(e.target.value))} disabled={!permissions.canManageSettings} className="mt-1" />
            </div>
            <div>
              <Label>Legacy Plan Minutes</Label>
              <Input type="number" value={legacyMinutes} onChange={(e) => setLegacyMinutes(Number(e.target.value))} disabled={!permissions.canManageSettings} className="mt-1" />
            </div>
          </div>

          <div className="max-w-xs">
            <Label>Session Duration Limit (minutes, 0 = no limit)</Label>
            <Input type="number" value={sessionLimit} onChange={(e) => setSessionLimit(Number(e.target.value))} disabled={!permissions.canManageSettings} className="mt-1" />
          </div>

          {permissions.canManageSettings && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              Save Settings
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan Defaults (Database Trigger)</CardTitle>
          <CardDescription>
            These limits are enforced by the <code>apply_story_group_plan_defaults</code> trigger on story_groups insert.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Feature</th>
                  <th className="text-center py-2 font-medium">Free</th>
                  <th className="text-center py-2 font-medium">Digital</th>
                  <th className="text-center py-2 font-medium">Legacy</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/40">
                  <td className="py-2">Minutes Limit</td>
                  <td className="text-center">{freeMinutes}</td>
                  <td className="text-center">{digitalMinutes}</td>
                  <td className="text-center">{legacyMinutes}</td>
                </tr>
                <tr className="border-b border-border/40"><td className="py-2">Words Limit</td><td className="text-center">2,000</td><td className="text-center">30,000</td><td className="text-center">Unlimited</td></tr>
                <tr className="border-b border-border/40"><td className="py-2">PDF Download</td><td className="text-center">❌</td><td className="text-center">✅</td><td className="text-center">✅</td></tr>
                <tr className="border-b border-border/40"><td className="py-2">Photo Uploads</td><td className="text-center">❌</td><td className="text-center">✅</td><td className="text-center">✅</td></tr>
                <tr className="border-b border-border/40"><td className="py-2">Printing</td><td className="text-center">❌</td><td className="text-center">❌</td><td className="text-center">✅</td></tr>
                <tr><td className="py-2">Archive After</td><td className="text-center">30 days</td><td className="text-center">Never</td><td className="text-center">Never</td></tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Note</p>
              <p>Changing recording limits here updates the system_settings table. The database trigger <code>apply_story_group_plan_defaults</code> still uses hardcoded values. To fully sync, you'll need to update the trigger to read from system_settings.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
