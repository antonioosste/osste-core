import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useAdminRole } from "@/hooks/useAdminRole";
import { Navigate } from "react-router-dom";

const QuestionImport = () => {
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const [csvContent, setCsvContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ 
    success: boolean; 
    imported?: number; 
    error?: string 
  } | null>(null);

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const parseCSV = (csv: string) => {
    const lines = csv.trim().split("\n");
    const questions = [];
    
    // Skip first two lines (title and header)
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV line - handle quoted values
      const matches = line.match(/(?:^|,)("(?:[^"]*(?:""[^"]*)*)"|[^,]*)/g);
      if (!matches || matches.length < 7) continue;
      
      const values = matches.map(m => 
        m.replace(/^,?"?|"?$/g, "").replace(/""/g, '"')
      );
      
      const [id, category, question, emotion_tags, followup_type, depth_level, locale_variant] = values;
      
      questions.push({
        id: parseInt(id),
        category,
        question,
        emotion_tags,
        followup_type,
        depth_level: parseInt(depth_level),
        locale_variant,
      });
    }
    
    return questions;
  };

  const handleImport = async () => {
    setLoading(true);
    setResult(null);

    try {
      const questions = parseCSV(csvContent);
      
      if (questions.length === 0) {
        throw new Error("No valid questions found in CSV");
      }

      // Upsert in chunks to avoid timeout
      const chunkSize = 100;
      let totalImported = 0;

      for (let i = 0; i < questions.length; i += chunkSize) {
        const chunk = questions.slice(i, i + chunkSize);
        const { error } = await supabase
          .from("questions")
          .upsert(chunk, { onConflict: "id" });

        if (error) throw error;
        totalImported += chunk.length;
      }

      setResult({ success: true, imported: totalImported });
      toast.success(`Successfully imported ${totalImported} questions!`);
      setCsvContent("");
    } catch (error) {
      console.error("Import error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to import questions";
      setResult({ success: false, error: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl font-bold mb-4">Import Question Bank</h1>
          <p className="text-muted-foreground">
            Paste the full OSSTE question bank CSV to sync it into Supabase
          </p>
        </div>

        <Card className="p-8">
          <div className="space-y-6">
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Instructions:</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Paste the complete CSV content including the header row</li>
                <li>• Format: id, category, question, emotion_tags, followup_type, depth_level, locale_variant</li>
                <li>• Questions with existing IDs will be updated</li>
                <li>• New questions will be inserted</li>
              </ul>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                CSV Content
              </label>
              <Textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="Paste CSV content here..."
                className="min-h-[300px] font-mono text-xs"
              />
            </div>

            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                {result.success ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Successfully imported {result.imported} questions!
                    </AlertDescription>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {result.error}
                    </AlertDescription>
                  </>
                )}
              </Alert>
            )}

            <Button
              onClick={handleImport}
              disabled={loading || !csvContent.trim()}
              size="lg"
              className="w-full h-14 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Import Question Bank
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Note: This will upsert questions based on ID. Existing questions will be updated.
            </p>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default QuestionImport;
