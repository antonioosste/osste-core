import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Play,
  Plus,
  BookOpen,
  ChevronRight,
  Crown,
  ArrowRight,
  AlertTriangle,
  Mic,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useProfile } from "@/hooks/useProfile";
import { useSessions } from "@/hooks/useSessions";
import { useStoryGroups } from "@/hooks/useStoryGroups";
import { useEntitlements } from "@/hooks/useEntitlements";
import { UpgradeDialog } from "@/components/dashboard/UpgradeDialog";

export function MobileHome() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { sessions } = useSessions();
  const { storyGroups, createStoryGroup } = useStoryGroups();
  const { accountUsage, isRecordingLimitReached } = useEntitlements();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);

  const hasAnyPaidProject = storyGroups?.some((g: any) => g.plan === "digital" || g.plan === "legacy") ?? false;
  const minutesUsed = accountUsage?.minutesUsed ?? 0;
  const minutesLimit = accountUsage?.minutesLimit ?? 20;
  const usagePercent = Math.min(100, Math.round((minutesUsed / minutesLimit) * 100));

  const activeSession = sessions.find((s) => s.status === "active" || !s.ended_at);

  const getChapterCount = (bookId: string) => sessions.filter((s) => s.story_group_id === bookId).length;

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

  const firstName = profile?.name?.split(" ")[0];

  return (
    <div className="px-5 pt-safe-top">
      {/* Greeting */}
      <div className="pt-10 pb-6">
        <p className="text-muted-foreground text-sm font-medium">
          {new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening"}
        </p>
        <h1 className="text-2xl font-serif font-bold text-foreground mt-1">
          {firstName ? `Welcome, ${firstName}` : "Welcome back"}
        </h1>
      </div>

      {/* Primary Actions */}
      <div className="flex gap-3 mb-6">
        <Button
          size="lg"
          className="flex-1 h-14 rounded-2xl text-base gap-2 shadow-sm"
          onClick={() => {
            if (isRecordingLimitReached) {
              setShowUpgrade(true);
            } else {
              navigate("/session");
            }
          }}
          variant={isRecordingLimitReached ? "outline" : "default"}
        >
          {isRecordingLimitReached ? (
            <>
              <AlertTriangle className="w-5 h-5" />
              Limit Reached
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Start Story
            </>
          )}
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-14 rounded-2xl px-5"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Resume banner */}
      {activeSession && (
        <Card
          className="mb-6 border-primary/20 bg-primary/5 cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => navigate(`/session?id=${activeSession.id}`)}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Mic className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm">Continue Recording</p>
              <p className="text-xs text-muted-foreground truncate">
                {activeSession.title || "In-progress session"}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>
      )}

      {/* Usage */}
      <Card className="mb-6 border-border/40">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Recording Time</span>
            <span className="text-sm font-medium text-foreground">
              {minutesUsed} / {minutesLimit} min
            </span>
          </div>
          <Progress value={usagePercent} className="h-2" />
        </CardContent>
      </Card>

      {/* Upgrade CTA */}
      {!hasAnyPaidProject && (
        <Card
          className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => navigate("/pricing")}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm">Unlock Full Access</p>
              <p className="text-xs text-muted-foreground">More recording time & features</p>
            </div>
            <ArrowRight className="h-5 w-5 text-primary shrink-0" />
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <Card className="border-border/40">
          <CardContent className="p-3 text-center">
            <BookOpen className="h-5 w-5 text-primary/70 mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{storyGroups?.length || 0}</p>
            <p className="text-[10px] text-muted-foreground">Books</p>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="p-3 text-center">
            <Mic className="h-5 w-5 text-primary/70 mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{sessions.length}</p>
            <p className="text-[10px] text-muted-foreground">Chapters</p>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="p-3 text-center">
            <FileText className="h-5 w-5 text-primary/70 mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{minutesUsed}</p>
            <p className="text-[10px] text-muted-foreground">Minutes</p>
          </CardContent>
        </Card>
      </div>

      {/* Your Books */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-serif font-bold text-foreground">Your Books</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/books")} className="text-primary text-xs">
            See all <ChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        </div>

        {storyGroups && storyGroups.length > 0 ? (
          <div className="space-y-3">
            {storyGroups.slice(0, 4).map((book) => (
              <Card
                key={book.id}
                className="border-border/40 cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => navigate(`/books/${book.id}`)}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="h-11 w-11 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{book.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {getChapterCount(book.id)} {getChapterCount(book.id) === 1 ? "chapter" : "chapters"}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-border/60">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground mb-1">No books yet</p>
              <p className="text-xs text-muted-foreground mb-4">Create your first book to start</p>
              <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> New Book
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Book Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Create New Book</DialogTitle>
            <DialogDescription>Start a new story project</DialogDescription>
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
