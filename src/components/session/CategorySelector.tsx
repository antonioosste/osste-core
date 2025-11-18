import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QUESTION_CATEGORIES, type QuestionCategory } from "@/types/questions";
import { matchCategoryFromText } from "@/lib/categoryMatcher";
import { Sparkles, Search } from "lucide-react";

interface CategorySelectorProps {
  onCategorySelected: (category: QuestionCategory | "surprise", depthLevel: number) => void;
}

export const CategorySelector = ({ onCategorySelected }: CategorySelectorProps) => {
  const [freeText, setFreeText] = useState("");
  const [depthLevel, setDepthLevel] = useState<1 | 2 | 3>(2);

  const handleFreeTextMatch = () => {
    const matched = matchCategoryFromText(freeText);
    if (matched) {
      onCategorySelected(matched, depthLevel);
    } else {
      onCategorySelected("surprise", depthLevel);
    }
  };

  return (
    <Card className="p-8 space-y-8">
      <div className="text-center space-y-4">
        <h2 className="font-serif text-3xl md:text-4xl font-bold">
          Which part of your life do you feel like talking about today?
        </h2>
        <p className="text-muted-foreground text-sm md:text-base">
          You can switch topics or questions at any time. OSSTE will weave everything into one continuous story.
        </p>
      </div>

      {/* Depth Level Selector */}
      <div className="space-y-3">
        <label className="text-sm font-medium">How deep would you like to go today?</label>
        <div className="flex gap-2">
          {[
            { value: 1, label: "Light" },
            { value: 2, label: "Medium" },
            { value: 3, label: "Deep" },
          ].map(({ value, label }) => (
            <Button
              key={value}
              variant={depthLevel === value ? "default" : "outline"}
              onClick={() => setDepthLevel(value as 1 | 2 | 3)}
              className="flex-1"
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Free Text Input */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Or tell us in your own words...</label>
        <div className="flex gap-2">
          <Input
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="e.g., I want to talk about my grandparents and childhood in Lebanon"
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && freeText.trim() && handleFreeTextMatch()}
          />
          <Button
            onClick={handleFreeTextMatch}
            disabled={!freeText.trim()}
            variant="secondary"
          >
            <Search className="w-4 h-4 mr-2" />
            Match Topic
          </Button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Choose a category:</label>
        <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto p-2">
          {QUESTION_CATEGORIES.map((category) => (
            <Badge
              key={category}
              variant="outline"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-sm py-2 px-4"
              onClick={() => onCategorySelected(category, depthLevel)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      {/* Surprise Me Button */}
      <Button
        variant="secondary"
        size="lg"
        onClick={() => onCategorySelected("surprise", depthLevel)}
        className="w-full"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        I'm not sure, surprise me
      </Button>
    </Card>
  );
};
