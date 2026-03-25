import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SessionHeaderProps {
  sessionTime: number;
  questionNumber?: number;
  totalQuestions?: number;
  isGenerating: boolean;
  onCancel: () => void;
  onSaveAndExit: () => void;
}

export function SessionHeader({
  sessionTime,
  questionNumber,
  totalQuestions,
  isGenerating,
  onCancel,
  onSaveAndExit,
}: SessionHeaderProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
      <Button
        variant="ghost"
        size="sm"
        onClick={onCancel}
        disabled={isGenerating}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        Cancel
      </Button>

      <div className="flex flex-col items-center gap-1">
        <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground/60">
          Recording Session
        </span>
        <div className="flex items-center gap-3">
          <span className="text-sm tabular-nums text-muted-foreground font-medium">
            {formatTime(sessionTime)}
          </span>
          {questionNumber != null && totalQuestions != null && totalQuestions > 0 && (
            <>
              <span className="text-muted-foreground/30">·</span>
              <span className="text-xs text-muted-foreground/60">
                Question {questionNumber} of {totalQuestions}
              </span>
            </>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onSaveAndExit}
        disabled={isGenerating}
        className="text-primary hover:text-primary/80 font-medium transition-colors"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
            Saving
          </>
        ) : (
          "Done"
        )}
      </Button>
    </div>
  );
}
