"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Sparkles, Shuffle, BookOpen } from "lucide-react";

/** Topic → list of prompts. You can extend or load from DB. */
const QUESTION_BANK: Record<string, string[]> = {
  "Childhood": [
    "Tell me about your earliest childhood memory. What stands out most vividly?",
    "Who was your best friend growing up? What did you love doing together?",
    "What was a typical day like in your home when you were 10?",
    "What did your parents or grandparents teach you that stuck for life?"
  ],
  "Family & Traditions": [
    "What's a family tradition you still cherish? How did it start?",
    "Tell me the story behind a recipe, song, or object your family treasures.",
    "Describe a time your family overcame a tough challenge together."
  ],
  "Love & Relationships": [
    "How did you meet your partner? What do you remember about the first moments?",
    "What's a small gesture that made you feel deeply loved?"
  ],
  "Career & Purpose": [
    "What was your first job and what did it teach you?",
    "When did you feel most proud of your work? What happened?"
  ],
  "Wisdom & Advice": [
    "If you could leave one lesson for future generations, what would it be?",
    "What's a belief you changed your mind about—and why?"
  ],
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
  // Uncontrolled fallbacks
  const initialTopic = controlledTopic ?? Object.keys(QUESTION_BANK)[0];
  const [topic, setTopic] = React.useState<string>(initialTopic);
  const [question, setQuestion] = React.useState<string>(
    controlledQuestion ?? QUESTION_BANK[initialTopic][0]
  );

  // Keep controlled values in sync if parent passes them
  React.useEffect(() => {
    if (controlledTopic) setTopic(controlledTopic);
  }, [controlledTopic]);
  React.useEffect(() => {
    if (controlledQuestion) setQuestion(controlledQuestion);
  }, [controlledQuestion]);

  const questionsForTopic = QUESTION_BANK[topic] ?? [];

  const pickRandom = React.useCallback(() => {
    const list = QUESTION_BANK[topic] ?? [];
    if (!list.length) return;
    const others = list.filter((q) => q !== question);
    const next = others.length ? others[Math.floor(Math.random() * others.length)] : question;
    if (!controlledQuestion) setQuestion(next);
    onQuestionChange?.(next);
    onNewPrompt?.(topic, next);
  }, [topic, question, controlledQuestion, onQuestionChange, onNewPrompt]);

  const nextSequential = React.useCallback(() => {
    const list = QUESTION_BANK[topic] ?? [];
    if (!list.length) return;
    const idx = Math.max(0, list.indexOf(question));
    const next = list[(idx + 1) % list.length];
    if (!controlledQuestion) setQuestion(next);
    onQuestionChange?.(next);
    onNewPrompt?.(topic, next);
  }, [topic, question, controlledQuestion, onQuestionChange, onNewPrompt]);

  const handleTopicChange = (value: string) => {
    if (!controlledTopic) setTopic(value);
    onTopicChange?.(value);
    // Reset question to first item of the new topic
    const first = (QUESTION_BANK[value] ?? [])[0] ?? "";
    if (!controlledQuestion) setQuestion(first);
    onQuestionChange?.(first);
    onNewPrompt?.(value, first);
  };

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
          <Select value={topic} onValueChange={handleTopicChange}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select a topic…" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(QUESTION_BANK).map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="rounded-lg border bg-background p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-5 w-5 text-primary shrink-0" />
              <p className="text-[15px] leading-relaxed">{question}</p>
            </div>
          </div>
        </div>

        {/* (Optional) quick list of topic questions */}
        <div className="flex flex-wrap gap-2 pt-1">
          {questionsForTopic.slice(0, 6).map((q) => (
            <button
              key={q}
              onClick={() => {
                if (!controlledQuestion) setQuestion(q);
                onQuestionChange?.(q);
                onNewPrompt?.(topic, q);
              }}
              className={cn(
                "text-left px-3 py-1.5 rounded-full border text-sm transition-colors",
                q === question
                  ? "bg-primary/10 border-primary text-primary"
                  : "hover:bg-accent"
              )}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
