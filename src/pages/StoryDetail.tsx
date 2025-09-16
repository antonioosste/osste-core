import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Edit, 
  Share2, 
  Download, 
  Play, 
  Pause, 
  Settings,
  CheckCircle,
  RotateCcw,
  FileText,
  Calendar,
  MapPin,
  User,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Header } from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";

const sampleStory = {
  id: "1",
  title: "Childhood Memories in Brooklyn",
  summary: "Growing up in 1950s Brooklyn, with stories of the neighborhood candy store and summer stickball games.",
  polishedContent: `I was born in Brooklyn in 1942, right in the heart of what we called "the neighborhood." Our block was lined with brownstones, each one filled with families who knew each other's business—and I mean that in the best possible way.

The candy store on the corner was owned by Mr. Goldstein, a kind man with thick glasses who always had a smile for us kids. We'd spend our nickels on penny candy, carefully choosing each piece from the glass jars that lined the counter. There were Swedish fish, Mary Janes, and those little wax bottles filled with colored syrup that we'd bite the tops off of.

Summer meant stickball in the street. We'd use a broomstick and a pink rubber ball—what we called a "spaldeen." The manhole covers were our bases, and we'd play until the streetlights came on and our mothers called us in for dinner.

The neighborhood was alive with sounds: kids playing, mothers calling from windows, the knife sharpener's bell, and the ice cream truck playing its tinny melody. Everyone looked out for everyone else's kids. If you misbehaved three blocks from home, your mother would know about it before you got back.

Those were simpler times, but they were rich with community and connection. Every day was an adventure, even if it was just walking to the corner store or playing in the street until dark.`,
  transcript: [
    {
      timestamp: "00:00",
      speaker: "Interviewer",
      text: "Tell me about your earliest childhood memory. What stands out most vividly?"
    },
    {
      timestamp: "00:15",
      speaker: "You",
      text: "Well, I was born in Brooklyn in 1942, and... um... our block was lined with brownstones. Each one filled with families who knew each other's business, and I mean that in the best possible way."
    },
    {
      timestamp: "00:45",
      speaker: "Interviewer", 
      text: "That sounds like a close-knit community. Can you tell me more about the neighborhood?"
    },
    {
      timestamp: "01:02",
      speaker: "You",
      text: "Oh yes! The candy store on the corner was owned by Mr. Goldstein. He was this kind man with thick glasses who always had a smile for us kids. We'd spend our nickels on penny candy..."
    },
    {
      timestamp: "01:35",
      speaker: "You",
      text: "There were Swedish fish, Mary Janes, and those little wax bottles filled with colored syrup. We'd bite the tops off of them, you know?"
    },
    {
      timestamp: "02:15",
      speaker: "Interviewer",
      text: "What did you do for fun in the neighborhood?"
    },
    {
      timestamp: "02:22",
      speaker: "You", 
      text: "Summer meant stickball in the street! We'd use a broomstick and a pink rubber ball - what we called a 'spaldeen.' The manhole covers were our bases."
    },
  ],
  status: "polished",
  date: "2 days ago",
  duration: "32 min",
  wordCount: 342,
  tags: ["childhood", "brooklyn", "1950s"],
  audioUrl: "#", // Mock URL
  entities: {
    people: ["Mr. Goldstein"],
    places: ["Brooklyn", "neighborhood", "candy store", "corner"],
    dates: ["1942", "1950s", "Summer"],
    events: ["stickball games", "penny candy shopping"]
  }
};

export default function StoryDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [editedContent, setEditedContent] = useState(sampleStory.polishedContent);
  const [regenerateDialog, setRegenerateDialog] = useState(false);
  const [factsDrawerOpen, setFactsDrawerOpen] = useState(false);

  const handlePlayAudio = () => {
    setIsPlaying(!isPlaying);
    // Mock audio play/pause
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    toast({
      title: "Story updated",
      description: "Your changes have been saved successfully."
    });
  };

  const handleApprove = () => {
    toast({
      title: "Story approved",
      description: "This story is now ready for publishing and book inclusion."
    });
  };

  const handleRegenerate = () => {
    setRegenerateDialog(false);
    toast({
      title: "Regenerating story",
      description: "AI is creating a new version based on the transcript."
    });
  };

  const formatTimestamp = (timestamp: string) => {
    return timestamp;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link to="/stories">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Stories
            </Link>
          </Button>
        </div>

        {/* Story Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {sampleStory.title}
              </h1>
              <p className="text-muted-foreground mb-4">
                {sampleStory.summary}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Badge variant={sampleStory.status === "approved" ? "default" : "secondary"}>
                  {sampleStory.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {sampleStory.duration} • {sampleStory.wordCount} words • {sampleStory.date}
                </span>
                <div className="flex gap-1">
                  {sampleStory.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <Button onClick={handleApprove} className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Approve
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setRegenerateDialog(true)}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Regenerate
              </Button>
              <Sheet open={factsDrawerOpen} onOpenChange={setFactsDrawerOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Facts Check
                  </Button>
                </SheetTrigger>
                <SheetContent className="bg-background border-l">
                  <SheetHeader>
                    <SheetTitle>Story Facts & Entities</SheetTitle>
                    <SheetDescription>
                      Key people, places, and dates mentioned in this story
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    <div>
                      <h4 className="flex items-center gap-2 font-medium mb-3">
                        <User className="w-4 h-4" />
                        People
                      </h4>
                      <div className="space-y-2">
                        {sampleStory.entities.people.map((person, i) => (
                          <div key={i} className="p-2 bg-muted rounded-md text-sm">
                            {person}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="flex items-center gap-2 font-medium mb-3">
                        <MapPin className="w-4 h-4" />
                        Places
                      </h4>
                      <div className="space-y-2">
                        {sampleStory.entities.places.map((place, i) => (
                          <div key={i} className="p-2 bg-muted rounded-md text-sm">
                            {place}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="flex items-center gap-2 font-medium mb-3">
                        <Calendar className="w-4 h-4" />
                        Dates & Times
                      </h4>
                      <div className="space-y-2">
                        {sampleStory.entities.dates.map((date, i) => (
                          <div key={i} className="p-2 bg-muted rounded-md text-sm">
                            {date}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Two-Pane Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Pane - Transcript */}
          <Card className="h-fit">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Original Transcript
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlayAudio}
                className="gap-2"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? "Pause" : "Play"}
              </Button>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              <div className="space-y-4 text-sm">
                {sampleStory.transcript.map((entry, index) => (
                  <div 
                    key={index} 
                    className={`border-l-4 pl-4 ${
                      entry.speaker === "Interviewer" 
                        ? "border-primary" 
                        : "border-secondary"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">
                        {entry.speaker}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        [{formatTimestamp(entry.timestamp)}]
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      {entry.text}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right Pane - Polished Story */}
          <Card className="h-fit">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Polished Story</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="min-h-[500px] resize-none"
                    placeholder="Edit your story..."
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit}>Save Changes</Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="prose max-w-none">
                  <div 
                    className="font-serif text-foreground leading-relaxed max-h-[600px] overflow-y-auto"
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    {sampleStory.polishedContent.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="mb-4">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button className="flex-1" asChild>
            <Link to="/book/preview">Add to Book</Link>
          </Button>
          <Button variant="outline" className="flex-1 gap-2">
            <Share2 className="w-4 h-4" />
            Share with Family
          </Button>
          <Button variant="outline" className="flex-1 gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Regenerate Confirmation Dialog */}
      <Dialog open={regenerateDialog} onOpenChange={setRegenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Story?</DialogTitle>
            <DialogDescription>
              This will create a new polished version of the story based on the original transcript. 
              Your current edits will be replaced. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegenerateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRegenerate}>
              Regenerate Story
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}