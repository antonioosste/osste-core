import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Sparkles, Shuffle, BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Topic = {
  id: string;
  name: string;
};

type Prompt = {
  id: string;
  topic_id: string | null;
  text: string;
};

export type QuestionSwitcherProps = {
  className?: string;
  /** Controlled state from parent (optional) */
  topic?: string;
  onTopicChange?: (topic: string) => void;
  question?: string;
  onQuestionChange?: (question: string) => void;
  /** Called whenever a new question is chosen (good place to reset timers) */
  onNewPrompt?: (topic: string, question: string) => void;
};

export function QuestionSwitcher({
  className,
  topic: controlledTopic,
  onTopicChange,
  question: controlledQuestion,
  onQuestionChange,
  onNewPrompt,
}: QuestionSwitcherProps) {
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [prompts, setPrompts] = React.useState<Prompt[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  const [selectedTopicId, setSelectedTopicId] = React.useState<string>("");
  const [question, setQuestion] = React.useState<string>(
    controlledQuestion ?? ""
  );

  // Load topics and prompts from database
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load topics
        const { data: topicsData, error: topicsError } = await supabase
          .from("topics")
          .select("*")
          .order("name");

        if (topicsError) throw topicsError;

        // Load all prompts
        const { data: promptsData, error: promptsError } = await supabase
          .from("prompts")
          .select("*")
          .order("created_at");

        if (promptsError) throw promptsError;

        setTopics(topicsData || []);
        setPrompts(promptsData || []);

        // Set initial topic and question if not controlled
        if (!controlledTopic && topicsData && topicsData.length > 0) {
          const firstTopic = topicsData[0];
          setSelectedTopicId(firstTopic.id);
          
          const firstPrompt = promptsData?.find(p => p.topic_id === firstTopic.id);
          if (firstPrompt && !controlledQuestion) {
            setQuestion(firstPrompt.text);
            onQuestionChange?.(firstPrompt.text);
          }
        }
      } catch (error) {
        console.error("Error loading topics/prompts:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Keep controlled values in sync if parent passes them
  React.useEffect(() => {
    if (controlledTopic) {
      const topic = topics.find(t => t.name === controlledTopic);
      if (topic) setSelectedTopicId(topic.id);
    }
  }, [controlledTopic, topics]);
  
  React.useEffect(() => {
    if (controlledQuestion) setQuestion(controlledQuestion);
  }, [controlledQuestion]);

  const questionsForTopic = prompts.filter(p => p.topic_id === selectedTopicId);
  const currentTopic = topics.find(t => t.id === selectedTopicId);

  const pickRandom = React.useCallback(() => {
    const list = questionsForTopic;
    if (!list.length) return;
    const others = list.filter((q) => q.text !== question);
    const next = others.length ? others[Math.floor(Math.random() * others.length)] : list[0];
    if (!controlledQuestion) setQuestion(next.text);
    onQuestionChange?.(next.text);
    onNewPrompt?.(currentTopic?.name || "", next.text);
  }, [questionsForTopic, question, currentTopic, controlledQuestion, onQuestionChange, onNewPrompt]);

  const nextSequential = React.useCallback(() => {
    const list = questionsForTopic;
    if (!list.length) return;
    const idx = Math.max(0, list.findIndex(q => q.text === question));
    const next = list[(idx + 1) % list.length];
    if (!controlledQuestion) setQuestion(next.text);
    onQuestionChange?.(next.text);
    onNewPrompt?.(currentTopic?.name || "", next.text);
  }, [questionsForTopic, question, currentTopic, controlledQuestion, onQuestionChange, onNewPrompt]);

  const handleTopicChange = (topicId: string) => {
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return;
    
    if (!controlledTopic) setSelectedTopicId(topicId);
    onTopicChange?.(topic.name);
    
    // Reset question to first item of the new topic
    const firstPrompt = prompts.find(p => p.topic_id === topicId);
    if (firstPrompt) {
      if (!controlledQuestion) setQuestion(firstPrompt.text);
      onQuestionChange?.(firstPrompt.text);
      onNewPrompt?.(topic.name, firstPrompt.text);
    }
  };

  if (loading) {
    return (
      <div className={cn("rounded-xl border bg-card backdrop-blur p-4 sm:p-5", className)}>
        <div className="flex items-center justify-center gap-2 py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading questions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border bg-card backdrop-blur p-4 sm:p-5", className)}>
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-semibold">Topic</span>
            <Badge variant="secondary">
              Chapter Guide
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={pickRandom} className="gap-2">
              <Shuffle className="h-4 w-4" />
              New Question
            </Button>
            <Button onClick={nextSequential} className="gap-2">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[260px_1fr] gap-3 sm:gap-4">
          <Select value={selectedTopicId} onValueChange={handleTopicChange}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select a topic…" />
            </SelectTrigger>
            <SelectContent>
              {topics.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="rounded-lg border bg-background p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-5 w-5 text-primary shrink-0" />
              <p className="text-[15px] leading-relaxed">
                {question || "Select a topic to see questions"}
              </p>
            </div>
          </div>
        </div>

        {/* Quick list of topic questions */}
        {questionsForTopic.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {questionsForTopic.slice(0, 6).map((q) => (
              <button
                key={q.id}
                onClick={() => {
                  if (!controlledQuestion) setQuestion(q.text);
                  onQuestionChange?.(q.text);
                  onNewPrompt?.(currentTopic?.name || "", q.text);
                }}
                className={cn(
                  "text-left px-3 py-1.5 rounded-full border text-sm transition-colors",
                  q.text === question
                    ? "bg-primary/10 border-primary text-primary"
                    : "hover:bg-accent"
                )}
              >
                {q.text.length > 60 ? q.text.substring(0, 60) + "..." : q.text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
