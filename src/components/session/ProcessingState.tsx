export function ProcessingState() {
  return (
    <div className="flex flex-col items-center gap-6 animate-fade-in py-12">
      <div className="flex space-x-2">
        <div className="w-2.5 h-2.5 bg-primary/60 rounded-full animate-bounce" />
        <div className="w-2.5 h-2.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
        <div className="w-2.5 h-2.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
      </div>
      <p className="text-sm text-muted-foreground font-medium tracking-wide text-center max-w-[240px] leading-relaxed">
        Turning your story into something beautiful…
      </p>
    </div>
  );
}
