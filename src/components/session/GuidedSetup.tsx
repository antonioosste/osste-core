import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BACKEND_URL } from "@/config/backend";
import { useAuth } from "@/hooks/useAuth";

interface Topic {
  id: string;
  name: string;
}

interface Prompt {
  id: string;
  text: string;
  topic_id: string;
}

interface GuidedSetupProps {
  onComplete: (starterQuestion: string) => void;
  onSkip: () => void;
}

export function GuidedSetup({ onComplete, onSkip }: GuidedSetupProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState<'topic' | 'prompts'>('topic');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedPrompts, setSelectedPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const loadTopics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('question_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setTopics(data || []);
    } catch (error) {
      console.error('Error loading topics:', error);
      toast({
        title: "Failed to load topics",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load topics on mount
  useEffect(() => {
    loadTopics();
  }, []);

  const handleTopicSelect = async (topic: Topic) => {
    setSelectedTopic(topic);
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('id, question_text, category_id')
        .eq('category_id', topic.id)
        .eq('active', true);
      
      if (error) throw error;
      // Map questions to prompts format
      const mappedPrompts = (data || []).map(q => ({
        id: q.id,
        text: q.question_text,
        topic_id: q.category_id || topic.id
      }));
      setPrompts(mappedPrompts);
      setStep('prompts');
    } catch (error) {
      console.error('Error loading prompts:', error);
      toast({
        title: "Failed to load questions",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePrompt = (prompt: Prompt) => {
    setSelectedPrompts(prev => {
      const exists = prev.find(p => p.id === prompt.id);
      if (exists) {
        return prev.filter(p => p.id !== prompt.id);
      } else {
        // Limit to 3 questions
        if (prev.length >= 3) {
          toast({
            title: "Maximum reached",
            description: "You can select up to 3 questions",
            variant: "default"
          });
          return prev;
        }
        return [...prev, prompt];
      }
    });
  };

  const handleComplete = async () => {
    if (!selectedTopic || selectedPrompts.length === 0) return;
    
    setIsStarting(true);
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      // Call backend API
      const response = await fetch(`${BACKEND_URL}/api/guided/hints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          topicId: selectedTopic.id,
          selectedQuestionIds: selectedPrompts.map(p => p.id)
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get starter question: ${response.status}`);
      }

      const data = await response.json();
      if (!data.starterQuestion) {
        throw new Error("No starter question returned");
      }

      // Pass the starter question to parent
      onComplete(data.starterQuestion);
      
    } catch (error) {
      console.error('Error getting starter question:', error);
      toast({
        title: "Failed to start",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsStarting(false);
    }
  };

  if (loading && topics.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {step === 'topic' ? 'Want some guidance?' : 'Select Your Questions'}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {step === 'topic' 
                    ? 'Choose a topic and questions, or skip to record freely'
                    : `Choose up to 3 questions from ${selectedTopic?.name}`
                  }
                </p>
              </div>
            </div>
            {step === 'topic' && (
              <Button variant="ghost" onClick={onSkip}>
                Skip
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {step === 'topic' ? (
            <>
              <div className="flex flex-wrap gap-2 p-4">
                {topics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => handleTopicSelect(topic)}
                    className="px-4 py-2 rounded-full bg-secondary/50 hover:bg-primary hover:text-primary-foreground transition-all duration-200 text-sm font-medium border border-border hover:border-primary hover:scale-105"
                  >
                    {topic.name}
                  </button>
                ))}
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="ghost" onClick={onSkip}>
                  Skip & Record Freely
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select up to 3 questions you'd like to explore during your recording.
                </p>
                <div className="flex flex-wrap gap-2 max-h-[400px] overflow-y-auto p-2">
                  {prompts.map((prompt) => {
                    const isSelected = selectedPrompts.find(p => p.id === prompt.id);
                    return (
                      <button
                        key={prompt.id}
                        onClick={() => togglePrompt(prompt)}
                        className={`px-4 py-2 rounded-full text-sm transition-all duration-200 border group hover:scale-105 ${
                          isSelected 
                            ? 'bg-primary text-primary-foreground border-primary shadow-md' 
                            : 'bg-secondary/50 hover:bg-secondary border-border hover:border-primary/50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {isSelected && <Check className="h-3 w-3" />}
                          <span>{prompt.text}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex justify-between items-center gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setStep('topic')}>
                  Back to Topics
                </Button>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">
                    {selectedPrompts.length} / 3 selected
                  </Badge>
                  <Button 
                    onClick={handleComplete}
                    disabled={selectedPrompts.length === 0 || isStarting}
                  >
                    {isStarting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      'Start Recording'
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
