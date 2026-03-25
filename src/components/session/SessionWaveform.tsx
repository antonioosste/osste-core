import { cn } from "@/lib/utils";

interface SessionWaveformProps {
  data: number[];
  visible: boolean;
}

export function SessionWaveform({ data, visible }: SessionWaveformProps) {
  if (!visible) return null;

  return (
    <div className="flex items-center justify-center gap-[3px] h-10 animate-fade-in">
      {data.map((height, index) => (
        <div
          key={index}
          className={cn(
            "w-[3px] rounded-full transition-all duration-75",
            "bg-primary/60"
          )}
          style={{
            height: `${Math.max(4, height / 2.5)}px`,
          }}
        />
      ))}
    </div>
  );
}
