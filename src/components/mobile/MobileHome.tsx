import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import {
  Play,
  Plus,
  BookOpen,
  ChevronRight,
  Mic,
  Feather,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProfile } from "@/hooks/useProfile";
import { useSessions } from "@/hooks/useSessions";
import { useStoryGroups } from "@/hooks/useStoryGroups";
import { useStories } from "@/hooks/useStories";
import { useEntitlements } from "@/hooks/useEntitlements";
import { UpgradeDialog } from "@/components/dashboard/UpgradeDialog";

const PROMPTS = [
  "What's your earliest memory?",
  "Tell me about someone who changed your life",
  "What moment shaped who you are?",
  "What's a story your family always tells?",
  "Describe a place that feels like home",
  "What advice would you give your younger self?",
  "What's a lesson you learned the hard way?",
  "Who taught you something you'll never forget?",
];

export function MobileHome() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { sessions } = useSessions();
  const { storyGroups, createStoryGroup } = useStoryGroups();
  const { stories } = useStories();
  const { isRecordingLimitReached } = useEntitlements();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);

  const activeSession = sessions.find((s) => s.status === "active" || !s.ended_at);

  // Rotate prompt daily
  const dailyPrompt = useMemo(() => {
    const dayIndex = Math.floor(Date.now() / 86400000) % PROMPTS.length;
    return PROMPTS[dayIndex];
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      const book = await createStoryGroup(newTitle.trim(), newDesc.trim() || undefined);
      setIsCreateOpen(false);
      setNewTitle("");
      setNewDesc("");
      navigate(`/books/${book.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartStory = () => {
    if (isRecordingLimitReached) {
      setShowUpgrade(true);
    } else {
      navigate("/session");
    }
  };

  const firstName = profile?.name?.split(" ")[0];
  const greeting = new Date().getHours() < 12
    ? "Good morning"
    : new Date().getHours() < 18
    ? "Good afternoon"
    : "Good evening";

  // Milestone messaging
  const storyCount = stories.length;
  const milestoneMessage = storyCount === 0
    ? null
    : storyCount === 1
    ? "You've started your first story — keep going!"
    : `You're building something special — ${storyCount} stories so far`;

  return (
    <div className="px-5 pt-safe-top flex flex-col min-h-[calc(100vh-5rem)]">
      {/* Greeting */}
      <div className="pt-12 pb-1">
        <p className="text-muted-foreground text-sm font-medium tracking-wide">
          {activeSession ? "Welcome back 👋" : greeting}
        </p>
        <h1 className="text-2xl font-serif font-bold text-foreground mt-1">
          {activeSession
            ? "Let's continue your story"
            : firstName
            ? firstName
            : "Welcome back"}
        </h1>
      </div>

      {/* Daily storytelling prompt */}
      <div className="mt-3 mb-6 animate-fade-in">
        <Card className="border-border/30 bg-primary/[0.03]">
          <CardContent className="p-4 flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-primary/60 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed italic">
              "{dailyPrompt}"
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resume banner — prominent when active session exists */}
      {activeSession && (
        <Card
          className="mb-4 border-primary/20 bg-primary/5 cursor-pointer active:scale-[0.98] transition-transform animate-fade-in"
          onClick={() => navigate(`/session?id=${activeSession.id}`)}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Play className="h-4 w-4 text-primary ml-0.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm">Continue your story</p>
              <p className="text-xs text-muted-foreground truncate">
                {activeSession.title || "Pick up where you left off"}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>
      )}

      {/* Primary CTA */}
      <Button
        size="lg"
        className="w-full h-14 rounded-2xl text-base gap-3 shadow-md mb-4 animate-fade-in"
        onClick={handleStartStory}
      >
        <Mic className="w-5 h-5" />
        Start a New Story
      </Button>

      {/* Milestone badge */}
      {milestoneMessage && (
        <p className="text-xs text-center text-muted-foreground/70 mb-2 animate-fade-in">
          {milestoneMessage}
        </p>
      )}

      {/* Spacer */}
      <div className="flex-1 min-h-6" />

      {/* Recent Books */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Recent
          </h2>
          {storyGroups && storyGroups.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/stories")} className="text-primary text-xs h-auto p-0">
              See all
            </Button>
          )}
        </div>

        {storyGroups && storyGroups.length > 0 ? (
          <div className="space-y-2">
            {storyGroups.slice(0, 3).map((book) => (
              <button
                key={book.id}
                className="flex items-center gap-3 w-full p-3 rounded-xl active:bg-muted/50 transition-colors text-left"
                onClick={() => navigate(`/books/${book.id}`)}
              >
                <div className="h-9 w-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4 text-primary/70" />
                </div>
                <span className="text-sm font-medium text-foreground truncate flex-1">
                  {book.title}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-10 text-center animate-fade-in">
            <Feather className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground mb-1">Your memories begin here</p>
            <p className="text-xs text-muted-foreground/60 mb-5">
              Record your first story and we'll turn it into something beautiful
            </p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" /> Create a Book
            </Button>
          </div>
        )}
      </div>

      {/* Create Book Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Create New Book</DialogTitle>
            <DialogDescription>Give your story collection a name</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="m-title">Book Title</Label>
              <Input
                id="m-title"
                placeholder="e.g., My Childhood"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-desc">Description (Optional)</Label>
              <Textarea
                id="m-desc"
                placeholder="What will this book be about?"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={3}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newTitle.trim()} className="rounded-xl">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UpgradeDialog open={showUpgrade} onOpenChange={setShowUpgrade} />
    </div>
  );
}
