import { cn } from "@/lib/utils";

interface SuggestedQuestionsProps {
  questions: string[];
  onSelect: (question: string) => void;
}

export function SuggestedQuestions({ questions, onSelect }: SuggestedQuestionsProps) {
  if (questions.length === 0) return null;

  return (
    <div className="w-full max-w-lg animate-fade-in space-y-3">
      <p className="text-xs text-center text-muted-foreground/60 uppercase tracking-wider font-medium">
        Or explore another direction
      </p>
      <div className="space-y-2">
        {questions.map((suggestion, index) => (
          <button
            key={`suggestion-${index}-${suggestion.slice(0, 20)}`}
            onClick={() => onSelect(suggestion)}
            className={cn(
              "w-full text-left px-5 py-3.5 rounded-2xl",
              "border border-border/30 bg-card/50 backdrop-blur-sm",
              "hover:bg-accent/20 hover:border-primary/20",
              "transition-all duration-200",
              "group"
            )}
          >
            <p className="text-sm text-foreground/80 leading-relaxed group-hover:text-foreground transition-colors">
              {suggestion}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
