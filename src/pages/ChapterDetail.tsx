import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useChapters } from "@/hooks/useChapters";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChapterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [overallSummary, setOverallSummary] = useState("");
  const { getChapter, updateChapter } = useChapters();

  useEffect(() => {
    if (id) {
      getChapter(id).then((data: any) => {
        setChapter(data);
        setTitle(data?.title || "");
        setSummary(data?.summary || "");
        setOverallSummary(data?.overall_summary || "");
      });
    }
  }, [id]);

  const handleSave = async () => {
    if (!id) return;

    await updateChapter(id, {
      title,
      summary,
      overall_summary: overallSummary,
    });
  };

  if (!chapter) {
    return (
      <div className="min-h-screen bg-background">
        <Header isAuthenticated={true} />
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link to={`/recordings/${chapter.recording_id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Recording
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Edit Chapter</h1>
          <p className="text-muted-foreground">
            Update the chapter title and summaries
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Chapter Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter chapter title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Enter chapter summary"
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="overall">Overall Summary</Label>
              <Textarea
                id="overall"
                value={overallSummary}
                onChange={(e) => setOverallSummary(e.target.value)}
                placeholder="Enter overall summary"
                rows={6}
              />
            </div>

            <div className="flex items-center gap-4">
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/recordings/${chapter.recording_id}`}>Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
