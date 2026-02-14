import { useState } from "react";
import { Sparkles, Check, Edit, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AiTitleSuggestionProps {
  suggestedTitle: string;
  onAccept: (title: string) => Promise<void>;
  onDismiss: () => void;
}

export function AiTitleSuggestion({ suggestedTitle, onAccept, onDismiss }: AiTitleSuggestionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(suggestedTitle);
  const [isSaving, setIsSaving] = useState(false);

  const handleAccept = async (title: string) => {
    setIsSaving(true);
    try {
      await onAccept(title);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Edit book title</p>
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="max-w-md"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAccept(editValue.trim())}
                  disabled={!editValue.trim() || isSaving}
                >
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setIsEditing(false); setEditValue(suggestedTitle); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-1">AI Suggested Title</p>
              <p className="text-base font-semibold text-foreground mb-3">"{suggestedTitle}"</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAccept(suggestedTitle)}
                  disabled={isSaving}
                >
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Use This Title
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="w-3.5 h-3.5 mr-1.5" />
                  Edit Manually
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDismiss}
                >
                  <X className="w-3.5 h-3.5 mr-1.5" />
                  Dismiss
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
