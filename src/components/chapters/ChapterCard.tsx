import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Calendar, 
  Clock, 
  Mic, 
  Trash2, 
  Edit, 
  Eye,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChapterCardProps {
  sessionId: string;
  chapterId?: string;
  chapterIndex: number;
  title: string;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  mode: string | null;
  hasChapterContent: boolean;
  onEdit: (sessionId: string, newTitle: string) => Promise<void>;
  onDelete: (sessionId: string) => void;
}

export function ChapterCard({
  sessionId,
  chapterId,
  chapterIndex,
  title,
  status,
  startedAt,
  endedAt,
  mode,
  hasChapterContent,
  onEdit,
  onDelete,
}: ChapterCardProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [isSaving, setIsSaving] = useState(false);

  const isCompleted = status === 'completed';
  const canView = isCompleted && hasChapterContent && chapterId;

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatDuration = (start: string | null, end: string | null) => {
    if (!start) return "N/A";
    if (!end) return "In Progress";
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    return `${minutes} min`;
  };

  const getModeLabel = (mode: string | null) => {
    if (!mode) return null;
    return mode === 'guided' ? 'Guided' : 'Free Recording';
  };

  const handleSave = async () => {
    if (!editTitle.trim()) return;
    setIsSaving(true);
    try {
      await onEdit(sessionId, editTitle.trim());
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditTitle(title);
      setIsEditing(false);
    }
  };

  return (
    <Card className="group border-border/50 hover:border-border hover:shadow-sm transition-all duration-200">
      <CardContent className="p-5">
        {/* Top Row: Chapter Badge + Status */}
        <div className="flex items-center justify-between mb-3">
          <Badge 
            variant="outline" 
            className="font-medium text-xs px-2.5 py-0.5 bg-muted/50"
          >
            Chapter {chapterIndex}
          </Badge>
          <Badge 
            variant={isCompleted ? 'default' : 'secondary'}
            className={cn(
              "text-xs font-medium",
              isCompleted 
                ? "bg-primary/10 text-primary border-primary/20" 
                : "bg-muted text-muted-foreground"
            )}
          >
            {isCompleted ? 'Completed' : 'Active'}
          </Badge>
        </div>

        {/* Title Section */}
        <div className="mb-4">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-9 text-base font-semibold"
                placeholder="Chapter title"
                autoFocus
                onKeyDown={handleKeyDown}
                disabled={isSaving}
              />
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={isSaving || !editTitle.trim()}
                className="h-9"
              >
                Save
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => {
                  setEditTitle(title);
                  setIsEditing(false);
                }}
                disabled={isSaving}
                className="h-9"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground leading-tight line-clamp-1">
                {title}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </div>
          )}
        </div>

        {/* Metadata Row */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formatDate(startedAt)}</span>
          <span className="mx-1.5 text-border">•</span>
          <Clock className="w-3.5 h-3.5" />
          <span>{formatDuration(startedAt, endedAt)}</span>
          {mode && (
            <>
              <span className="mx-1.5 text-border">•</span>
              <Mic className="w-3.5 h-3.5" />
              <span>{getModeLabel(mode)}</span>
            </>
          )}
        </div>

        {/* Action Row */}
        <div className="flex items-center gap-2 pt-3 border-t border-border/50">
          {/* Continue Button - always show unless completed */}
          {!isCompleted && (
            <Button 
              size="sm"
              onClick={() => navigate(`/session?id=${sessionId}`)}
              className="h-8"
            >
              <Play className="w-3.5 h-3.5 mr-1.5" />
              Continue
            </Button>
          )}
          
          {/* View Button - only show if completed AND has chapter content */}
          {canView && (
            <Button 
              variant={isCompleted ? "default" : "outline"}
              size="sm"
              onClick={() => navigate(`/chapters/${chapterId}`)}
              className="h-8"
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              View
            </Button>
          )}

          {/* If completed but wants to continue editing */}
          {isCompleted && (
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigate(`/session?id=${sessionId}`)}
              className="h-8"
            >
              <Play className="w-3.5 h-3.5 mr-1.5" />
              Continue
            </Button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Delete Button */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onDelete(sessionId)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
