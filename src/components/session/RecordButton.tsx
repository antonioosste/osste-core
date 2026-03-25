import { Mic, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecordButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  disabled: boolean;
  onToggle: () => void;
}

export function RecordButton({ isRecording, isProcessing, disabled, onToggle }: RecordButtonProps) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer pulse ring - only when recording */}
      {isRecording && (
        <>
          <div className="absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-destructive/10 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-destructive/5 animate-pulse" />
        </>
      )}

      {/* Main button */}
      <button
        onClick={onToggle}
        disabled={disabled}
        className={cn(
          "relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          isProcessing
            ? "bg-muted text-muted-foreground cursor-wait"
            : isRecording
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 scale-110"
              : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95"
        )}
      >
        {isProcessing ? (
          <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin" />
        ) : isRecording ? (
          <Square className="w-7 h-7 sm:w-8 sm:h-8" />
        ) : (
          <Mic className="w-8 h-8 sm:w-10 sm:h-10" />
        )}
      </button>
    </div>
  );
}
