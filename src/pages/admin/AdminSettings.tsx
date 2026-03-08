import { Settings, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
        <p className="text-muted-foreground">Platform configuration (owner only)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" /> Current Configuration
          </CardTitle>
          <CardDescription>
            These settings reflect the current system behavior. Database-level changes require migration updates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SettingItem label="Beta Mode" value="Enabled" description="New users require admin approval before accessing the app." />
            <SettingItem label="Auto-Approval" value="Disabled" description="Users are only approved via waitlist or admin action." />
            <SettingItem label="Free Plan Recording Limit" value="20 minutes" description="Maximum recording time for free-tier story groups." />
            <SettingItem label="Digital Plan Recording Limit" value="60 minutes" description="Maximum recording time for digital-tier story groups." />
            <SettingItem label="Legacy Plan Recording Limit" value="120 minutes" description="Maximum recording time for legacy-tier story groups." />
            <SettingItem label="Session Duration Limit" value="No limit" description="Individual sessions have no hard time cap." />
            <SettingItem label="PDF Generation" value="Digital + Legacy" description="PDF download enabled for digital and legacy plans." />
            <SettingItem label="Print Orders" value="Legacy only" description="Physical book printing available for legacy plan." />
          </div>

          <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Dynamic Settings Coming Soon</p>
              <p>Editable system settings (toggle beta mode, adjust limits, configure AI models) will be available in a future update. Currently these are managed via database triggers and edge function configuration.</p>
            </div>
          </div>
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
                  <td className="text-center">20</td>
                  <td className="text-center">60</td>
                  <td className="text-center">120</td>
                </tr>
                <tr className="border-b border-border/40">
                  <td className="py-2">Words Limit</td>
                  <td className="text-center">2,000</td>
                  <td className="text-center">30,000</td>
                  <td className="text-center">Unlimited</td>
                </tr>
                <tr className="border-b border-border/40">
                  <td className="py-2">PDF Download</td>
                  <td className="text-center">❌</td>
                  <td className="text-center">✅</td>
                  <td className="text-center">✅</td>
                </tr>
                <tr className="border-b border-border/40">
                  <td className="py-2">Photo Uploads</td>
                  <td className="text-center">❌</td>
                  <td className="text-center">✅</td>
                  <td className="text-center">✅</td>
                </tr>
                <tr className="border-b border-border/40">
                  <td className="py-2">Printing</td>
                  <td className="text-center">❌</td>
                  <td className="text-center">❌</td>
                  <td className="text-center">✅</td>
                </tr>
                <tr>
                  <td className="py-2">Archive After</td>
                  <td className="text-center">30 days</td>
                  <td className="text-center">Never</td>
                  <td className="text-center">Never</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingItem({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <Badge variant="outline" className="text-xs">{value}</Badge>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
