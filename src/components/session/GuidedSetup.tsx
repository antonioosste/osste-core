import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  onComplete: (topicId: string, selectedPrompts: Prompt[]) => void;
  onCancel: () => void;
}

export function GuidedSetup({ onComplete, onCancel }: GuidedSetupProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'topic' | 'prompts'>('topic');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedPrompts, setSelectedPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(false);

  // Load topics on mount
  useState(() => {
    loadTopics();
  });

  const loadTopics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('topics')
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

  const handleTopicSelect = async (topic: Topic) => {
    setSelectedTopic(topic);
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('topic_id', topic.id);
      
      if (error) throw error;
      setPrompts(data || []);
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
        return [...prev, prompt];
      }
    });
  };

  const handleComplete = () => {
    if (selectedTopic && selectedPrompts.length > 0) {
      onComplete(selectedTopic.id, selectedPrompts);
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
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">
                {step === 'topic' ? 'Choose Your Topic' : 'Select Your Questions'}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {step === 'topic' 
                  ? 'Pick a topic to guide your storytelling session'
                  : `Choose questions from ${selectedTopic?.name}`
                }
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {step === 'topic' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {topics.map((topic) => (
                  <Card
                    key={topic.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleTopicSelect(topic)}
                  >
                    <CardContent className="p-4">
                      <p className="font-medium text-foreground">{topic.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Select the questions you'd like to explore. You can choose multiple.
                </p>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {prompts.map((prompt) => {
                    const isSelected = selectedPrompts.find(p => p.id === prompt.id);
                    return (
                      <Card
                        key={prompt.id}
                        className={`cursor-pointer transition-all ${
                          isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                        }`}
                        onClick={() => togglePrompt(prompt)}
                      >
                        <CardContent className="p-4 flex items-start gap-3">
                          <div className={`h-5 w-5 rounded border-2 flex-shrink-0 mt-0.5 ${
                            isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                          }`}>
                            {isSelected && (
                              <svg className="w-full h-full text-primary-foreground" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <p className="text-sm text-foreground">{prompt.text}</p>
                        </CardContent>
                      </Card>
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
                    {selectedPrompts.length} question{selectedPrompts.length !== 1 ? 's' : ''} selected
                  </Badge>
                  <Button 
                    onClick={handleComplete}
                    disabled={selectedPrompts.length === 0}
                  >
                    Start Recording Session
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
