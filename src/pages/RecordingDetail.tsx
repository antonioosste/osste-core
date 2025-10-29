import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FileAudio, Calendar, Clock, FileText, BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useRecordings } from "@/hooks/useRecordings";
import { useTranscripts } from "@/hooks/useTranscripts";
import { useChapters } from "@/hooks/useChapters";
import { useTurns } from "@/hooks/useTurns";
import { Skeleton } from "@/components/ui/skeleton";

export default function RecordingDetail() {
  const { id } = useParams<{ id: string }>();
  const [recording, setRecording] = useState<any>(null);
  const { getRecording } = useRecordings();
  const { transcripts, loading: transcriptsLoading } = useTranscripts(id);
  const { chapters, loading: chaptersLoading } = useChapters(id);
  const { turns, loading: turnsLoading } = useTurns(id);

  useEffect(() => {
    if (id) {
      getRecording(id).then(setRecording);
    }
  }, [id]);

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!recording) {
    return (
      <div className="min-h-screen bg-background">
        <Header isAuthenticated={true} />
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      
      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/sessions">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sessions
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Recording Details</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {formatDate(recording.created_at)}
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              {formatDuration(recording.duration_seconds)}
            </div>
            <Badge variant={recording.status === 'processed' ? 'default' : 'secondary'}>
              {recording.status}
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 mb-8 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transcripts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transcripts.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chapters</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{chapters.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Turns</CardTitle>
              <FileAudio className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{turns.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transcripts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="transcripts">Transcripts</TabsTrigger>
            <TabsTrigger value="chapters">Chapters</TabsTrigger>
            <TabsTrigger value="turns">Conversation</TabsTrigger>
          </TabsList>

          <TabsContent value="transcripts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transcripts</CardTitle>
              </CardHeader>
              <CardContent>
                {transcriptsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : transcripts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No transcripts available</p>
                ) : (
                  <div className="space-y-4">
                    {transcripts.map((transcript) => (
                      <div key={transcript.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{transcript.language || 'en'}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {transcript.word_count} words
                          </span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {transcript.text || "No text available"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chapters" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Chapters</CardTitle>
              </CardHeader>
              <CardContent>
                {chaptersLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : chapters.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No chapters available</p>
                ) : (
                  <div className="space-y-4">
                    {chapters.map((chapter) => (
                      <Link 
                        key={chapter.id} 
                        to={`/chapters/${chapter.id}`}
                        className="block border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <h3 className="font-semibold text-foreground mb-2">
                          {chapter.title || `Chapter ${chapter.order_index || 1}`}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {chapter.summary || "No summary available"}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="turns" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Conversation History</CardTitle>
              </CardHeader>
              <CardContent>
                {turnsLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : turns.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No conversation history available</p>
                ) : (
                  <div className="space-y-4">
                    {turns.map((turn) => (
                      <div key={turn.id} className="space-y-2">
                        {(turn as any).prompt_text && (
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-sm font-medium text-foreground mb-1">AI:</p>
                            <p className="text-sm text-muted-foreground">{(turn as any).prompt_text}</p>
                          </div>
                        )}
                        {turn.stt_text && (
                          <div className="bg-primary/10 rounded-lg p-3 ml-8">
                            <p className="text-sm font-medium text-foreground mb-1">You:</p>
                            <p className="text-sm text-foreground">{turn.stt_text}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
