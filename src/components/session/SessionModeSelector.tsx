import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Mic } from "lucide-react";

interface SessionModeSelectorProps {
  open: boolean;
  onSelect: (mode: 'guided' | 'non-guided', category?: string) => void;
  onClose: () => void;
}

const CATEGORIES = [
  "Childhood",
  "Family & Traditions",
  "Career & Work",
  "Love & Relationships",
  "Travel & Adventure",
  "Challenges & Triumphs",
  "Life Lessons",
  "Dreams & Aspirations"
];

export function SessionModeSelector({ open, onSelect, onClose }: SessionModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<'guided' | 'non-guided' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const handleContinue = () => {
    if (selectedMode === 'guided' && selectedCategory) {
      onSelect('guided', selectedCategory);
    } else if (selectedMode === 'non-guided') {
      onSelect('non-guided');
    }
  };

  const canContinue = selectedMode === 'non-guided' || (selectedMode === 'guided' && selectedCategory);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Choose Your Recording Path</DialogTitle>
          <DialogDescription>
            Select how you'd like to capture your story today
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card 
              className={`p-6 cursor-pointer transition-all hover:border-primary ${
                selectedMode === 'guided' ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => setSelectedMode('guided')}
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Guided Path</h3>
                  <p className="text-sm text-muted-foreground">
                    Follow curated questions on a specific topic to help guide your storytelling
                  </p>
                </div>
              </div>
            </Card>

            <Card 
              className={`p-6 cursor-pointer transition-all hover:border-primary ${
                selectedMode === 'non-guided' ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => setSelectedMode('non-guided')}
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mic className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Free Recording</h3>
                  <p className="text-sm text-muted-foreground">
                    Record your story freely without prompts or guidance
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {selectedMode === 'guided' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-4">
              <label className="text-sm font-medium">Select a topic</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Choose a topic..." />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button 
            onClick={handleContinue} 
            disabled={!canContinue}
            size="lg"
          >
            Start Recording
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
