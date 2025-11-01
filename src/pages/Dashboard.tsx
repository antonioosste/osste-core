import { Link } from "react-router-dom";
import { 
  Clock, 
  Mic, 
  BookOpen, 
  Play, 
  CheckCircle, 
  Circle,
  Settings,
  ArrowRight,
  Crown,
  FileAudio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useSessions } from "@/hooks/useSessions";
import { useStories } from "@/hooks/useStories";
import { useProfile } from "@/hooks/useProfile";
import { useRecordings } from "@/hooks/useRecordings";

export default function Dashboard() {
  const { sessions, loading: sessionsLoading } = useSessions();
  const { stories, loading: storiesLoading } = useStories();
  const { profile } = useProfile();
  const { recordings, loading: recordingsLoading } = useRecordings();
  
  const isLoading = sessionsLoading || storiesLoading || recordingsLoading;
  const userPaid = profile?.plan !== 'free';
  
  // Calculate stats from real data
  const totalRecordings = recordings.length;
  const totalSessions = sessions.length;
  const completedStories = stories.filter(s => s.approved).length;
  const totalMinutes = recordings.reduce((sum, r) => sum + (r.duration_seconds || 0), 0) / 60;
  const minutesLimit = userPaid ? 500 : 120;

  const recentStories = stories.slice(0, 5);

  const onboardingSteps = [
    { id: 1, title: "Complete your profile", completed: true, link: "/settings" },
    { id: 2, title: "Record your first story", completed: true, link: "/session" },
    { id: 3, title: "Polish and approve a story", completed: false, link: "/stories" },
    { id: 4, title: "Create your first book", completed: false, link: "/book/preview" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case "in-progress":
        return <Badge variant="secondary">In Progress</Badge>;
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Continue capturing your family stories.
          </p>
        </div>

        {/* Paywall Card for Unpaid Users */}
        {!userPaid && (
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 mb-8">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Crown className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Unlock Full Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Get unlimited recording time and advanced features
                  </p>
                </div>
              </div>
              <Button asChild className="shrink-0">
                <Link to="/pricing">
                  View Plans
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Progress Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Stories</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stories.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {completedStories} approved
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sessions</CardTitle>
                  <Mic className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalSessions}</div>
                  <p className="text-xs text-muted-foreground">
                    recording sessions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recordings</CardTitle>
                  <FileAudio className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalRecordings}</div>
                  <div className="mt-2">
                    <Progress 
                      value={(totalMinutes / minutesLimit) * 100} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round(totalMinutes)}/{minutesLimit} minutes
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Continue Session */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mic className="w-5 h-5 text-primary" />
                  <span>Continue Your Story</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Ready to capture more memories? Start a new recording session.
                </p>
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link to="/session">
                    <Play className="w-4 h-4 mr-2" />
                    Start Recording
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Your Stories Table */}
            <Card>
              <CardHeader>
                <CardTitle>Your Stories</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentStories.map((story) => (
                        <TableRow key={story.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium">
                            <Link to={`/stories/${story.id}`} className="hover:text-primary">
                              {story.title || "Untitled Story"}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant={story.approved ? 'default' : 'secondary'}>
                              {story.approved ? 'Approved' : 'Draft'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">N/A</TableCell>
                          <TableCell className="text-muted-foreground">
                            {story.created_at ? new Date(story.created_at).toLocaleDateString() : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" asChild>
                    <Link to="/stories">View All Stories</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Onboarding */}
          <div className="lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Getting Started</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {onboardingSteps.map((step) => (
                  <div key={step.id} className="flex items-center space-x-3">
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1">
                      {step.completed ? (
                        <span className="text-sm text-muted-foreground line-through">
                          {step.title}
                        </span>
                      ) : (
                        <Link 
                          to={step.link} 
                          className="text-sm text-foreground hover:text-primary"
                        >
                          {step.title}
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
                
                <div className="mt-6 pt-4 border-t">
                  <div className="text-sm text-center text-muted-foreground">
                    {onboardingSteps.filter(step => step.completed).length} of {onboardingSteps.length} completed
                  </div>
                  <Progress 
                    value={(onboardingSteps.filter(step => step.completed).length / onboardingSteps.length) * 100}
                    className="mt-2 h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" asChild className="w-full justify-start">
                  <Link to="/sessions">
                    <Mic className="w-4 h-4 mr-2" />
                    View All Sessions
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="w-full justify-start">
                  <Link to="/chapters">
                    <BookOpen className="w-4 h-4 mr-2" />
                    View Chapters
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="w-full justify-start">
                  <Link to="/book/preview">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Preview Book
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="w-full justify-start">
                  <Link to="/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Account Settings
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}