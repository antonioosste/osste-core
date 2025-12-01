import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FolderOpen, Sparkles } from "lucide-react";
import { useStoryGroups, StoryGroup } from "@/hooks/useStoryGroups";

interface StoryGroupSelectorProps {
  open: boolean;
  onSelect: (storyGroupId: string) => void;
  onClose: () => void;
}

export function StoryGroupSelector({ open, onSelect, onClose }: StoryGroupSelectorProps) {
  const { storyGroups, createStoryGroup } = useStoryGroups();
  const [selectedId, setSelectedId] = useState<string>("");
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNew = async () => {
    if (!newTitle.trim()) return;
    
    setIsCreating(true);
    try {
      const newGroup = await createStoryGroup(newTitle.trim(), newDescription.trim() || undefined);
      if (newGroup) {
        onSelect(newGroup.id);
      }
    } catch (error) {
      console.error('Failed to create story group:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelect = () => {
    if (selectedId) {
      onSelect(selectedId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Choose a Story Project
          </DialogTitle>
          <DialogDescription>
            Select which story project this recording session belongs to, or create a new one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!showCreateNew ? (
            <>
              {storyGroups && storyGroups.length > 0 ? (
                <RadioGroup value={selectedId} onValueChange={setSelectedId}>
                  <div className="grid gap-3">
                    {storyGroups.map((group: StoryGroup) => (
                      <label
                        key={group.id}
                        htmlFor={group.id}
                        className="cursor-pointer"
                      >
                        <Card className={`transition-all ${selectedId === group.id ? 'border-primary shadow-md' : 'hover:border-primary/50'}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <RadioGroupItem value={group.id} id={group.id} className="mt-1" />
                                <div className="flex-1">
                                  <CardTitle className="text-base">{group.title}</CardTitle>
                                  {group.description && (
                                    <CardDescription className="text-sm mt-1">
                                      {group.description}
                                    </CardDescription>
                                  )}
                                </div>
                              </div>
                              <Sparkles className="h-4 w-4 text-primary" />
                            </div>
                          </CardHeader>
                        </Card>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No story projects yet. Create your first one to get started!</p>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowCreateNew(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Story Project
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-title">Project Title</Label>
                <Input
                  id="new-title"
                  placeholder="e.g., Family Story, Career Journey, Travel Adventures"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-description">Description (Optional)</Label>
                <Textarea
                  id="new-description"
                  placeholder="What will this story be about?"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowCreateNew(false);
                  setNewTitle("");
                  setNewDescription("");
                }}
              >
                Back to List
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {!showCreateNew ? (
            <Button onClick={handleSelect} disabled={!selectedId}>
              Start Recording
            </Button>
          ) : (
            <Button onClick={handleCreateNew} disabled={!newTitle.trim() || isCreating}>
              {isCreating ? "Creating..." : "Create & Start Recording"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
