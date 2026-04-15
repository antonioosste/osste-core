import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  CreditCard,
  Shield,
  ChevronRight,
  LogOut,
  Crown,
  Star,
  Sparkles,
  HelpCircle,
  KeyRound,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PasswordStrength, isPasswordStrong } from "@/components/ui/password-strength";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useBilling } from "@/hooks/useBilling";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const PLAN_LABELS: Record<string, string> = { free: "Free", digital: "Digital Memoir", legacy: "Legacy Memoir" };
const PLAN_ICONS: Record<string, typeof Sparkles> = { free: Sparkles, digital: Star, legacy: Crown };

export function MobileProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { profile, loading, updateProfile } = useProfile();
  const { accountUsage } = useEntitlements();
  const { billing, isManual, isStripe } = useBilling();

  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    if (profile) setName(profile.name || "");
  }, [profile]);

  const planKey = accountUsage?.accountPlan || "free";
  const PlanIcon = PLAN_ICONS[planKey] || Sparkles;
  const minutesUsed = accountUsage?.minutesUsed ?? 0;
  const minutesLimit = accountUsage?.minutesLimit ?? 20;
  const usagePercent = Math.min(100, Math.round((minutesUsed / minutesLimit) * 100));

  const handleSave = async () => {
    try {
      await updateProfile({ name });
      toast({ title: "Profile saved" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) { toast({ title: "Current password required", variant: "destructive" }); return; }
    if (!isPasswordStrong(newPassword)) { toast({ title: "Password too weak", variant: "destructive" }); return; }
    if (newPassword !== confirmPassword) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    setPwLoading(true);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user?.email || "", password: currentPassword });
      if (signInErr) throw new Error("Current password is incorrect.");
      const { error: upErr } = await supabase.auth.updateUser({ password: newPassword });
      if (upErr) throw upErr;
      toast({ title: "Password updated" });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setShowPasswordSection(false);
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message, variant: "destructive" });
    } finally { setPwLoading(false); }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="px-5 pt-safe-top pb-4">
      {/* Header */}
      <div className="pt-10 pb-6 flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="bg-primary/10 text-primary text-lg font-serif">
            {profile?.name?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-serif font-bold text-foreground truncate">
            {profile?.name || "Your Profile"}
          </h1>
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
        </div>
      </div>

      {/* Plan Card */}
      <Card className="mb-4 border-border/40">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <PlanIcon className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground text-sm">{PLAN_LABELS[planKey]}</span>
            <Badge variant={planKey === "free" ? "secondary" : "default"} className="ml-auto text-[10px]">
              {PLAN_LABELS[planKey]}
            </Badge>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Recording time</span>
            <span>{minutesUsed} / {minutesLimit} min</span>
          </div>
          <Progress value={usagePercent} className="h-1.5" />
          {planKey === "free" && (
            <Button size="sm" className="w-full mt-3 rounded-xl" onClick={() => navigate("/pricing")}>
              Upgrade Plan
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Profile Edit */}
      <Card className="mb-4 border-border/40">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Profile</span>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl" disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Email</Label>
            <Input value={user?.email || ""} disabled className="h-11 rounded-xl" />
          </div>
          <Button size="sm" onClick={handleSave} disabled={loading} className="w-full rounded-xl">
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card className="mb-4 border-border/40">
        <CardContent className="p-4">
          <button
            className="flex items-center justify-between w-full"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
          >
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Change Password</span>
            </div>
            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${showPasswordSection ? "rotate-90" : ""}`} />
          </button>
          {showPasswordSection && (
            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Current Password</Label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">New Password</Label>
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordStrength password={newPassword} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Confirm Password</Label>
                <Input type={showPw ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <Button size="sm" className="w-full rounded-xl" onClick={handleChangePassword} disabled={pwLoading}>
                {pwLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Update Password
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card className="mb-4 border-border/40">
        <CardContent className="p-0 divide-y divide-border/40">
          {isStripe && (
            <button
              className="flex items-center gap-3 w-full p-4 text-left active:bg-muted/50 transition-colors"
              onClick={async () => {
                const { data } = await supabase.functions.invoke("customer-portal");
                if (data?.url) window.location.href = data.url;
              }}
            >
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground flex-1">Manage Billing</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          <button
            className="flex items-center gap-3 w-full p-4 text-left active:bg-muted/50 transition-colors"
            onClick={() => navigate("/help")}
          >
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground flex-1">Help & Support</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            className="flex items-center gap-3 w-full p-4 text-left active:bg-muted/50 transition-colors"
            onClick={() => navigate("/privacy")}
          >
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground flex-1">Privacy & Terms</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Button
        variant="outline"
        className="w-full rounded-xl h-12 text-destructive border-destructive/20 hover:bg-destructive/5"
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
}
