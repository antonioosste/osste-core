import { useNavigate } from "react-router-dom";
import { 
  Mic, 
  BookOpen, 
  Play, 
  ArrowRight,
  Crown,
  FileAudio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSessions } from "@/hooks/useSessions";
import { useStories } from "@/hooks/useStories";
import { useProfile } from "@/hooks/useProfile";
import { useRecordings } from "@/hooks/useRecordings";

export default function Dashboard() {
  const navigate = useNavigate();
  const { sessions, loading: sessionsLoading } = useSessions();
  const { stories } = useStories();
  const { profile } = useProfile();
  const { recordings } = useRecordings();
  
  const userPaid = profile?.plan !== 'free';
  
  // Calculate stats
  const totalRecordings = recordings.length;
  const totalSessions = sessions.length;
  const totalStories = stories.length;
  
  // Find active session
  const activeSession = sessions.find(s => s.status === 'active' || !s.ended_at);

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-serif font-bold text-foreground mb-3">
          Welcome back to your story archive
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Continue capturing the memories that matter most
        </p>
        
        <Button 
          size="lg" 
          className="gap-2 text-lg px-8 py-6 h-auto"
          onClick={() => navigate('/session')}
        >
          <Play className="w-5 h-5" />
          Start Recording
        </Button>
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
            <Button onClick={() => navigate('/pricing')} className="shrink-0">
              View Plans
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid gap-6 md:grid-cols-3 mb-12">
        <Card className="border-border/40 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Mic className="h-8 w-8 text-primary/70" />
              <span className="text-3xl font-bold text-foreground">{totalSessions}</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Recording Sessions</p>
          </CardContent>
        </Card>
        
        <Card className="border-border/40 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <FileAudio className="h-8 w-8 text-primary/70" />
              <span className="text-3xl font-bold text-foreground">{totalRecordings}</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Recordings</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="h-8 w-8 text-primary/70" />
              <span className="text-3xl font-bold text-foreground">{totalStories}</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Stories Created</p>
          </CardContent>
        </Card>
      </div>

      {/* Continue Active Session */}
      {activeSession && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Continue Your Active Session</h3>
                <p className="text-muted-foreground">
                  {(activeSession as any).title || "Untitled Session"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Started {activeSession.started_at ? new Date(activeSession.started_at).toLocaleDateString() : 'recently'}
                </p>
              </div>
              <Button onClick={() => navigate(`/session?id=${activeSession.id}`)}>
                <Play className="w-4 h-4 mr-2" />
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
