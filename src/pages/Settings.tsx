import { useState, useEffect } from "react";
import { User, CreditCard, Shield, LogOut, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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

export default function Settings() {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { profile, loading, updateProfile } = useProfile();
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

  const handleManageBilling = () => {
    toast({
      title: "Redirecting to billing portal",
      description: "Opening Stripe customer portal...",
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

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

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Current Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {profile?.plan === 'free' ? 'Free Plan' : 
                       profile?.plan === 'starter' ? 'Starter Plan' :
                       profile?.plan === 'standard' ? 'Standard Plan' :
                       profile?.plan === 'premium' ? 'Premium Plan' : 'Current Plan'}
                    </h3>
                    <p className="text-muted-foreground">
                      {profile?.plan === 'free' ? 'Limited features' : 'Full features'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {profile?.plan === 'free' ? '$0' : 
                       profile?.plan === 'starter' ? '$19' :
                       profile?.plan === 'standard' ? '$29' :
                       profile?.plan === 'premium' ? '$49' : '$0'}
                    </p>
                    <p className="text-sm text-muted-foreground">one-time</p>
                  </div>
                </div>
                <div className="flex gap-2 mb-4">
                  <Badge>{profile?.plan || 'free'}</Badge>
                </div>
                <Button onClick={handleManageBilling} className="w-full">
                  Manage Subscription
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Interview Sessions</span>
                    <span className="font-medium">8 / 15</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stories Generated</span>
                    <span className="font-medium">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Books Created</span>
                    <span className="font-medium">1 / 3</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


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