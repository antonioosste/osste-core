import { useState } from "react";
import { Plus, Clock, BookOpen, Mic, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { StoryCardSkeleton } from "@/components/loaders/StoryCardSkeleton";

const recentSessions = [
  {
    id: "1",
    title: "Childhood Memories",
    duration: "32 min",
    date: "2 hours ago",
    status: "completed",
  },
  {
    id: "2", 
    title: "War Stories",
    duration: "45 min",
    date: "Yesterday",
    status: "processing",
  },
  {
    id: "3",
    title: "Family Traditions",
    duration: "28 min", 
    date: "3 days ago",
    status: "completed",
  },
];

const stats = [
  {
    title: "Stories Captured",
    value: "12",
    icon: BookOpen,
    trend: "+3 this month",
  },
  {
    title: "Interview Hours",
    value: "8.5",
    icon: Clock,
    trend: "+2.1 this month", 
  },
  {
    title: "Family Members",
    value: "4",
    icon: Users,
    trend: "+1 this month",
  },
];

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);

  const handleStartSession = () => {
    // Navigate to session page
    window.location.href = "/session";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, John
          </h1>
          <p className="text-muted-foreground">
            Continue capturing your family's precious memories.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors cursor-pointer" onClick={handleStartSession}>
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Start New Interview</h3>
                <p className="text-sm text-muted-foreground">Begin capturing a new story</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Monthly Progress</h3>
                <Badge variant="secondary">3/5 stories</Badge>
              </div>
              <Progress value={60} className="mb-2" />
              <p className="text-sm text-muted-foreground">
                2 more stories to reach your monthly goal
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-success">{stat.trend}</p>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Sessions</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/stories">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <StoryCardSkeleton key={i} />
                ))}
              </div>
            ) : recentSessions.length > 0 ? (
              <div className="space-y-4">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                        <Mic className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{session.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {session.duration} • {session.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={session.status === "completed" ? "default" : "secondary"}
                      >
                        {session.status}
                      </Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/stories/${session.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Mic}
                title="No interviews yet"
                description="Start your first voice interview to begin capturing stories."
                action={{
                  label: "Start Interview",
                  onClick: handleStartSession,
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}