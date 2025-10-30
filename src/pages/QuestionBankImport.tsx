import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";

const QuestionBankImport = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; questions_imported?: number; followups_imported?: number; error?: string } | null>(null);

  const handleImport = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('seed-questions');

      if (error) throw error;

      setResult(data);
      toast.success(`Successfully imported ${data.questions_imported} questions and ${data.followups_imported} followup templates!`);
    } catch (error) {
      console.error('Import error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to import question bank';
      setResult({ success: false, error: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl font-bold mb-4">Import Question Bank</h1>
          <p className="text-muted-foreground">
            Import the complete OSSTE question bank with 400+ questions across 20 categories
          </p>
        </div>

        <Card className="p-8">
          <div className="space-y-6">
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="font-semibold mb-2">What will be imported:</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• 400+ curated life story questions</li>
                <li>• 20 thematic categories</li>
                <li>• 3 depth levels (Light, Reflective, Deep)</li>
                <li>• Emotion tags and followup types</li>
                <li>• 8 followup template types</li>
              </ul>
            </div>

            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                {result.success ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Successfully imported {result.questions_imported} questions and {result.followups_imported} followup templates!
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
              disabled={loading}
              size="lg"
              className="w-full h-14 text-lg"
            >
              <Upload className="w-5 h-5 mr-2" />
              {loading ? 'Importing...' : 'Import Question Bank'}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Note: This will add questions to your database. Run once only.
            </p>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default QuestionBankImport;