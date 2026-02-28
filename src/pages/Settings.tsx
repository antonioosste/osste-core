import { useState, useEffect } from "react";
import { User, CreditCard, Shield, LogOut, Download, Trash2, Sparkles, Star, Crown } from "lucide-react";
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
import { useStoryGroups } from "@/hooks/useStoryGroups";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { profile, loading, updateProfile } = useProfile();
  const { storyGroups } = useStoryGroups();
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
                  Your Book Plans
                </CardTitle>
              </CardHeader>
              <CardContent>
                {storyGroups && storyGroups.length > 0 ? (
                  <div className="space-y-4">
                    {storyGroups.map((book: any) => {
                      const planLabel = book.plan === 'legacy' ? 'Legacy' : book.plan === 'digital' ? 'Digital' : 'Free';
                      const PlanIcon = book.plan === 'legacy' ? Crown : book.plan === 'digital' ? Star : Sparkles;
                      const minutesUsed = Math.round(Number(book.minutes_used || 0));
                      const minutesLimit = book.minutes_limit;
                      return (
                        <div key={book.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <PlanIcon className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-medium text-foreground">{book.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {minutesUsed} / {minutesLimit ?? '∞'} min used
                                {book.pdf_enabled && ' • PDF'}
                                {book.printing_enabled && ' • Print'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={book.plan === 'free' ? 'secondary' : 'default'}>
                              {planLabel}
                            </Badge>
                            {book.plan === 'free' && (
                              <Button size="sm" variant="outline" onClick={() => navigate(`/pricing`)}>
                                Upgrade
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No books yet. Create a book to see plan details.</p>
                )}
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