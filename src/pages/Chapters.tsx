import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Calendar, FileText, ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useChapters } from "@/hooks/useChapters";
import { EmptyState } from "@/components/empty-states/EmptyState";

export default function Chapters() {
  const navigate = useNavigate();
  const { chapters, loading } = useChapters();

  // Group chapters by recording_id
  const groupedChapters = chapters.reduce((acc, chapter) => {
    const key = chapter.recording_id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(chapter);
    return acc;
  }, {} as Record<string, typeof chapters>);

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          
          <div className="flex items-center space-x-3 mb-2">
            <BookOpen className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Your Chapters</h1>
          </div>
          <p className="text-muted-foreground">
            View all AI-generated chapters from your recording sessions
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && chapters.length === 0 && (
          <EmptyState
            icon={BookOpen}
            title="No Chapters Yet"
            description="Chapters will be generated when you complete a recording session."
            action={{
              label: "Start Recording",
              onClick: () => navigate("/session")
            }}
          />
        )}

        {/* Chapters List */}
        {!loading && chapters.length > 0 && (
          <div className="space-y-8">
            {Object.entries(groupedChapters).map(([recordingId, recordingChapters]) => (
              <div key={recordingId}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">
                    Recording Session
                  </h2>
                  <Badge variant="secondary">
                    {recordingChapters.length} {recordingChapters.length === 1 ? 'Chapter' : 'Chapters'}
                  </Badge>
                </div>

                <div className="space-y-6">
                  {recordingChapters
                    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                    .map((chapter, index) => (
                      <Card key={chapter.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge variant="outline">Chapter {index + 1}</Badge>
                                {chapter.created_at && (
                                  <span className="text-xs text-muted-foreground flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {new Date(chapter.created_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              
                              <CardTitle className="text-2xl mb-2">
                                {chapter.title || "Untitled Chapter"}
                              </CardTitle>
                              
                              {chapter.suggested_cover_title && (
                                <p className="text-sm text-muted-foreground italic">
                                  Suggested Title: {chapter.suggested_cover_title}
                                </p>
                              )}
                            </div>
                            
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/chapters/${chapter.id}`}>
                                <FileText className="w-4 h-4 mr-2" />
                                Edit
                              </Link>
                            </Button>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          {/* Summary */}
                          {chapter.summary && (
                            <div>
                              <h4 className="font-semibold text-sm text-foreground mb-2">Summary</h4>
                              <p className="text-muted-foreground leading-relaxed">
                                {chapter.summary}
                              </p>
                            </div>
                          )}

                          {/* Overall Summary */}
                          {chapter.overall_summary && (
                            <>
                              <Separator />
                              <div>
                                <h4 className="font-semibold text-sm text-foreground mb-2">Overall Summary</h4>
                                <p className="text-muted-foreground leading-relaxed">
                                  {chapter.overall_summary}
                                </p>
                              </div>
                            </>
                          )}

                          {/* Quotes */}
                          {chapter.quotes && Array.isArray(chapter.quotes) && chapter.quotes.length > 0 && (
                            <>
                              <Separator />
                              <div>
                                <h4 className="font-semibold text-sm text-foreground mb-3">Notable Quotes</h4>
                                <div className="space-y-2">
                                  {chapter.quotes.map((quote: any, idx: number) => (
                                    <blockquote key={idx} className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground">
                                      "{typeof quote === 'string' ? quote : quote.text}"
                                    </blockquote>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}

                          {/* Image Hints */}
                          {chapter.image_hints && (
                            <>
                              <Separator />
                              <div>
                                <h4 className="font-semibold text-sm text-foreground mb-2">Image Suggestions</h4>
                                <p className="text-sm text-muted-foreground">
                                  {typeof chapter.image_hints === 'string' 
                                    ? chapter.image_hints 
                                    : JSON.stringify(chapter.image_hints)}
                                </p>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>

                <Separator className="my-8" />
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
