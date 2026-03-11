import { useState, useEffect, useRef } from "react";
import { User, CreditCard, Shield, LogOut, Download, Trash2, Sparkles, Star, Crown, ArrowRight, Settings2, BadgeCheck, Loader2, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Header } from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useBilling } from "@/hooks/useBilling";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  digital: "Digital Memoir",
  legacy: "Legacy Memoir",
};

const PLAN_ICONS: Record<string, typeof Sparkles> = {
  free: Sparkles,
  digital: Star,
  legacy: Crown,
};

export default function Settings() {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { profile, loading, updateProfile } = useProfile();
  const { accountUsage, loading: entLoading } = useEntitlements();
  const { billing, isManual, isStripe, loading: billingLoading } = useBilling();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const deleteEmailRef = useRef<HTMLInputElement>(null);
  const deletePasswordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
    }
    if (user) {
      setEmail(user.email || "");
    }
  }, [profile, user]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile({ name });
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };
  
  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw new Error(error.message);
      if (data?.error === "no_billing_record") {
        toast({
          title: "No billing record",
          description: "You're on the free plan. Upgrade to access billing management.",
        });
        return;
      }
      if (data?.error === "no_stripe_customer") {
        toast({
          title: "No billing record found",
          description: "No Stripe payment history was found for your account.",
        });
        return;
      }
      if (data?.error === "manual_billing") {
        toast({
          title: "Manually activated plan",
          description: "Your plan was activated manually. There is no Stripe billing to manage.",
        });
        return;
      }
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error: any) {
      toast({
        title: "Unable to open billing portal",
        description: error?.message || "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleExportData = () => {
    toast({
      title: "Export started",
      description: "Your data export has been initiated. You'll receive a download link via email.",
    });
  };

  const handleDeleteAccount = async () => {
    const enteredEmail = (deleteEmailRef.current?.value || deleteConfirmEmail).trim();
    const enteredPassword = deletePasswordRef.current?.value || deletePassword;
    const normalizedUserEmail = user?.email?.trim().toLowerCase();
    const normalizedEnteredEmail = enteredEmail.toLowerCase();

    setDeleteConfirmEmail(enteredEmail);
    setDeletePassword(enteredPassword);

    if (!normalizedUserEmail) {
      toast({ title: "Account email unavailable", description: "Please sign in again and retry account deletion.", variant: "destructive" });
      return;
    }

    if (normalizedEnteredEmail !== normalizedUserEmail) {
      toast({ title: "Email mismatch", description: "Please enter your account email correctly.", variant: "destructive" });
      return;
    }

    if (!enteredPassword.trim()) {
      toast({ title: "Password required", description: "Please enter your password to confirm.", variant: "destructive" });
      return;
    }

    setDeleteLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { email: enteredEmail, password: enteredPassword },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Account deleted",
        description: "Your account and all associated data have been permanently deleted.",
      });

      // Sign out locally
      await signOut();
      navigate("/login");
    } catch (err: any) {
      toast({
        title: "Account deletion failed",
        description: err?.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const planKey = accountUsage?.accountPlan || "free";
  const PlanIcon = PLAN_ICONS[planKey] || Sparkles;
  const usagePercent = accountUsage
    ? Math.min(100, Math.round((accountUsage.minutesUsed / accountUsage.minutesLimit) * 100))
    : 0;

  const isPaidPlan = planKey !== "free";

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and billing
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          {/* ── Profile ── */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email}
                    disabled={true}
                  />
                </div>
                <Button onClick={handleSaveProfile} disabled={loading}>
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Billing ── */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Account Plan &amp; Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {entLoading || billingLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                ) : accountUsage ? (
                  <>
                    {/* Plan badge */}
                    <div className="flex items-center gap-3">
                      <PlanIcon className="w-6 h-6 text-primary" />
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {PLAN_LABELS[planKey] || "Free"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {planKey === "free"
                            ? "Basic access — upgrade to unlock more recording time"
                            : "One-time purchase — no recurring charges"}
                        </p>
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        <Badge variant={planKey === "free" ? "secondary" : "default"}>
                          {PLAN_LABELS[planKey]}
                        </Badge>
                        {isManual && isPaidPlan && (
                          <Badge variant="outline" className="gap-1">
                            <BadgeCheck className="w-3 h-3" />
                            Beta Access
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Usage stats */}
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Minutes Included</span>
                        <span className="font-medium text-foreground">{accountUsage.minutesLimit} min</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Minutes Used</span>
                        <span className="font-medium text-foreground">{accountUsage.minutesUsed} min</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Minutes Remaining</span>
                        <span className={`font-medium ${accountUsage.minutesRemaining <= 5 ? "text-destructive" : "text-foreground"}`}>
                          {accountUsage.minutesRemaining} min
                        </span>
                      </div>
                      <Progress value={usagePercent} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        Recording time is shared across all your books.
                      </p>
                    </div>

                    {/* Actions based on plan + billing provider */}
                    {planKey === "free" ? (
                      <>
                        <Separator />
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">Want more recording time?</p>
                            <p className="text-sm text-muted-foreground">
                              Upgrade to Digital (60 min, PDF, photo uploads) or Legacy (120 min, printed hardcover) to preserve your memories forever.
                            </p>
                          </div>
                          <Button onClick={() => navigate("/pricing")} className="shrink-0">
                            Upgrade Plan
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </>
                    ) : isManual ? (
                      <>
                        <Separator />
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">Beta Access — Manually Activated</p>
                            <p className="text-sm text-muted-foreground">
                              Your plan was activated by an administrator. No billing record to manage.
                            </p>
                          </div>
                        </div>
                        {planKey === "digital" && (
                          <>
                            <Separator />
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div>
                                <p className="font-medium text-foreground">Upgrade Available</p>
                                <p className="text-sm text-muted-foreground">
                                  Get 120 minutes of recording, a printed hardcover book, professional formatting, and priority AI processing.
                                </p>
                              </div>
                              <Button onClick={() => navigate("/checkout?plan=legacy&flow=self")} className="shrink-0">
                                Upgrade to Legacy
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            </div>
                          </>
                        )}
                        {planKey === "legacy" && (
                          <div className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                            <Crown className="w-4 h-4 text-primary" />
                            You are on the highest plan.
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <Separator />
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">Manage Billing</p>
                            <p className="text-sm text-muted-foreground">
                              View payment history or update payment method.
                            </p>
                          </div>
                          <Button variant="outline" onClick={handleManageSubscription} className="shrink-0">
                            <Settings2 className="w-4 h-4 mr-2" />
                            Manage Billing
                          </Button>
                        </div>
                        {planKey === "digital" && (
                          <>
                            <Separator />
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div>
                                <p className="font-medium text-foreground">Upgrade Available</p>
                                <p className="text-sm text-muted-foreground">
                                  Get 120 minutes of recording, a printed hardcover book, professional formatting, and priority AI processing.
                                </p>
                              </div>
                              <Button onClick={() => navigate("/checkout?plan=legacy&flow=self")} className="shrink-0">
                                Upgrade to Legacy
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            </div>
                          </>
                        )}
                        {planKey === "legacy" && (
                          <div className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                            <Crown className="w-4 h-4 text-primary" />
                            You are on the highest plan.
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">No usage data available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Privacy ── */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Data Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">Export Your Data</p>
                    <p className="text-sm text-muted-foreground">Download all your stories and recordings</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export Data
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Export Your Data</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will create a downloadable file containing all your stories, recordings, and account data. 
                          You'll receive an email with the download link once the export is ready.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleExportData}>
                          Start Export
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <Separator />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-destructive">Delete Account</p>
                    <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                  </div>
                  <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
                    setDeleteDialogOpen(open);
                    if (open) {
                      setDeleteConfirmEmail(user?.email || "");
                      setDeletePassword("");
                      setShowDeletePassword(false);
                      return;
                    }
                    setDeletePassword("");
                    setDeleteConfirmEmail("");
                    setShowDeletePassword(false);
                  }}>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                          Delete Account Permanently
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-left space-y-3">
                          <p>This action <strong>cannot be undone</strong>. All of the following will be permanently deleted:</p>
                          <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                            <li>Your profile and account</li>
                            <li>All books, stories, and chapters</li>
                            <li>All recording sessions and audio files</li>
                            <li>All uploaded photos and images</li>
                            <li>Payment and billing records</li>
                            <li>Print order history</li>
                          </ul>
                          <p className="text-sm font-medium text-destructive">Please re-enter your credentials to confirm.</p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="delete-email" className="text-sm">Email</Label>
                          <Input
                            id="delete-email"
                            type="email"
                            placeholder={user?.email || "your@email.com"}
                            value={deleteConfirmEmail}
                            onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                            disabled={deleteLoading}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="delete-password" className="text-sm">Password</Label>
                          <div className="relative">
                            <Input
                              id="delete-password"
                              type={showDeletePassword ? "text" : "password"}
                              placeholder="Enter your password"
                              value={deletePassword}
                              onChange={(e) => setDeletePassword(e.target.value)}
                              disabled={deleteLoading}
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowDeletePassword(!showDeletePassword)}
                              tabIndex={-1}
                            >
                              {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteAccount}
                          disabled={deleteLoading || !deleteConfirmEmail || !deletePassword}
                        >
                          {deleteLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            "Delete My Account"
                          )}
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Account Actions */}
        <Card className="mt-8 border-destructive/20">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-medium text-foreground">Sign Out</h3>
                <p className="text-sm text-muted-foreground">Sign out of your account on this device</p>
              </div>
              <Button 
                variant="outline" 
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
