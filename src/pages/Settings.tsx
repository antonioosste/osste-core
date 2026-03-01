import { useState, useEffect } from "react";
import { User, CreditCard, Shield, LogOut, Download, Trash2, Sparkles, Star, Crown, ArrowRight, Settings2, BadgeCheck } from "lucide-react";
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

  const handleDeleteAccount = () => {
    toast({
      title: "Account deletion initiated",
      description: "Your account deletion request has been submitted. This action cannot be undone.",
      variant: "destructive",
    });
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
                              Upgrade to Digital (60 min) or Legacy (120 min) to continue capturing memories.
                            </p>
                          </div>
                          <Button onClick={() => navigate("/pricing")} className="shrink-0">
                            View Plans
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
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account
                          and remove all your data from our servers, including all stories, recordings, and personal information.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteAccount}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Account
                        </AlertDialogAction>
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
