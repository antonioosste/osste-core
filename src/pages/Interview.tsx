import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useInterview } from "@/hooks/useInterview";
import { Play, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const categories = [
  "All",
  "Childhood & Early Memories",
  "Family & Home Life",
  "School & Learning",
  "Friendships & Social Life",
  "First Experiences",
  "Teenage Years",
  "Work & Career",
  "Love & Relationships",
  "Parenthood & Family Building",
  "Travel & Adventure",
  "Hardship, Loss & Healing",
  "Identity & Self-Discovery",
  "Hobbies & Passions",
  "Community & Belonging",
  "Turning Points",
  "Wisdom & Reflection",
  "Dreams & Aspirations",
  "Cultural & Spiritual Life",
  "Legacy & Values"
];

const Interview = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDepth, setSelectedDepth] = useState(1);
  const [hasStarted, setHasStarted] = useState(false);
  const [followups, setFollowups] = useState<string[]>([]);
  const [goDeeper, setGoDeeper] = useState(false);

  const {
    currentQuestion,
    currentDepth,
    loading,
    fetchInitialQuestion,
    getFollowups,
    getBiasedFollowupTypes,
    escalateDepth
  } = useInterview();

  const handleStart = async () => {
    await fetchInitialQuestion({
      category: selectedCategory,
      depth_level: selectedDepth
    });
    setHasStarted(true);
  };

  useEffect(() => {
    const loadFollowups = async () => {
      if (currentQuestion) {
        const types = getBiasedFollowupTypes(undefined, currentQuestion.category_id || '');
        const prompts = await getFollowups(types);
        setFollowups(prompts.slice(0, 2)); // Show 2 follow-ups
      }
    };
    loadFollowups();
  }, [currentQuestion, getBiasedFollowupTypes, getFollowups]);

  const handleNextQuestion = async () => {
    if (goDeeper && currentDepth < 3) {
      await escalateDepth(selectedCategory === "All" ? currentQuestion?.category_id || "" : selectedCategory);
    } else {
      await fetchInitialQuestion({
        category: selectedCategory,
        depth_level: selectedDepth
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="font-serif text-5xl font-bold mb-4">Life Story Interview</h1>
          <p className="text-lg text-muted-foreground">
            Explore meaningful memories through thoughtful questions
          </p>
        </div>

        {!hasStarted ? (
          <Card className="p-8 shadow-lg">
            <h2 className="font-serif text-3xl font-semibold mb-6">Start Your Interview</h2>
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="category" className="text-base mb-2 block">
                  Choose a Category
                </Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category" className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="depth" className="text-base mb-2 block">
                  Conversation Depth
                </Label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 1, label: "Light", desc: "Easy, surface-level" },
                    { value: 2, label: "Reflective", desc: "Thoughtful exploration" },
                    { value: 3, label: "Deep", desc: "Profound introspection" }
                  ].map(({ value, label, desc }) => (
                    <button
                      key={value}
                      onClick={() => setSelectedDepth(value)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedDepth === value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-semibold text-lg">{label}</div>
                      <div className="text-sm text-muted-foreground">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleStart}
                disabled={loading}
                size="lg"
                className="w-full h-14 text-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Begin Interview
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <Badge variant="secondary" className="text-sm">
                  {currentQuestion?.category_id || 'General'}
                </Badge>
                <Badge variant="outline">
                  Depth Level {currentDepth}
                </Badge>
              </div>

              <h2 className="font-serif text-3xl font-semibold mb-8 leading-relaxed">
                {currentQuestion?.question_text}
              </h2>

              {followups.length > 0 && (
                <div className="space-y-3 mb-6">
                  <p className="text-sm font-medium text-muted-foreground">
                    Follow-up prompts:
                  </p>
                  {followups.map((prompt, i) => (
                    <div
                      key={i}
                      className="pl-4 py-2 border-l-2 border-primary/30 text-muted-foreground"
                    >
                      {prompt}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="go-deeper"
                    checked={goDeeper}
                    onCheckedChange={setGoDeeper}
                  />
                  <Label htmlFor="go-deeper" className="cursor-pointer">
                    Go Deeper on Next Question
                  </Label>
                </div>

                <Button
                  onClick={handleNextQuestion}
                  disabled={loading}
                  size="lg"
                >
                  Next Question
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Interview;