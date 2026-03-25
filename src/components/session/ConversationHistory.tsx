import { useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Message {
  id: string;
  type: "ai" | "user";
  content: string;
  timestamp: Date;
  isPartial?: boolean;
  topic?: string | null;
}

interface ConversationHistoryProps {
  messages: Message[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConversationHistory({ messages, open, onOpenChange }: ConversationHistoryProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const visibleMessages = messages.filter((m) => !m.isPartial);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (visibleMessages.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="w-full max-w-lg">
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground/60 uppercase tracking-wider font-medium">
            History
          </span>
          <span className="text-[10px] text-muted-foreground/40 tabular-nums">
            {visibleMessages.length}
          </span>
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <div className="overflow-y-auto max-h-[30vh] space-y-4 pb-4">
          {visibleMessages.map((message) => (
            <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.type === "user"
                    ? "bg-primary/10 text-foreground"
                    : "bg-muted/30 text-foreground"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                {message.type === "ai" && message.topic && (
                  <Badge variant="secondary" className="text-[10px] px-2 py-0 mt-2">
                    {message.topic}
                  </Badge>
                )}
                <p className="text-[10px] text-muted-foreground/40 mt-1.5">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
