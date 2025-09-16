import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Edit, Share2, Download, Play, Pause, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/layout/Header";

const sampleStory = {
  id: "1",
  title: "Childhood Memories in Brooklyn",
  summary: "Growing up in 1950s Brooklyn, with stories of the neighborhood candy store and summer stickball games.",
  content: `I was born in Brooklyn in 1942, right in the heart of what we called "the neighborhood." Our block was lined with brownstones, each one filled with families who knew each other's business – and I mean that in the best possible way.

The candy store on the corner was owned by Mr. Goldstein, a kind man with thick glasses who always had a smile for us kids. We'd spend our nickels on penny candy, carefully choosing each piece from the glass jars that lined the counter. There were Swedish fish, Mary Janes, and those little wax bottles filled with colored syrup that we'd bite the tops off of.

Summer meant stickball in the street. We'd use a broomstick and a pink rubber ball – what we called a "spaldeen." The manhole covers were our bases, and we'd play until the streetlights came on and our mothers called us in for dinner.

The neighborhood was alive with sounds: kids playing, mothers calling from windows, the knife sharpener's bell, and the ice cream truck playing its tinny melody. Everyone looked out for everyone else's kids. If you misbehaved three blocks from home, your mother would know about it before you got back.

Those were simpler times, but they were rich with community and connection. Every day was an adventure, even if it was just walking to the corner store or playing in the street until dark.`,
  status: "published",
  date: "2 days ago",
  duration: "32 min",
  tags: ["childhood", "brooklyn", "1950s"],
  audioUrl: "#", // Mock URL
};

export default function StoryDetail() {
  const { id } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [editedContent, setEditedContent] = useState(sampleStory.content);

  const handlePlayAudio = () => {
    setIsPlaying(!isPlaying);
    // Mock audio play/pause
  };

  const handleSaveEdit = () => {
    // Save edited content
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
                <Badge variant={sampleStory.status === "published" ? "default" : "secondary"}>
                  {sampleStory.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {sampleStory.duration} • {sampleStory.date}
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
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Audio Player */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handlePlayAudio}
                className="w-12 h-12 rounded-full"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Original Recording</span>
                  <span className="text-sm text-muted-foreground">32:45</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: "35%" }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Story Content */}
        <Tabs defaultValue="story" className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="story">Story</TabsTrigger>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="story" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Polished Story</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <Textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="min-h-[400px] resize-none"
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
                    {sampleStory.content.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="mb-4 text-foreground leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transcript" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Raw Transcript</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Automatically generated from the audio recording
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="border-l-4 border-primary pl-4">
                    <p className="font-medium text-foreground mb-1">Interviewer [00:00]</p>
                    <p className="text-muted-foreground">Tell me about your earliest childhood memory.</p>
                  </div>
                  <div className="border-l-4 border-secondary pl-4">
                    <p className="font-medium text-foreground mb-1">You [00:15]</p>
                    <p className="text-muted-foreground">
                      Well, I was born in Brooklyn in 1942, and... um... our block was lined with brownstones...
                    </p>
                  </div>
                  {/* More transcript entries would go here */}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Key Themes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge variant="outline">Community</Badge>
                    <Badge variant="outline">Childhood</Badge>
                    <Badge variant="outline">1950s Brooklyn</Badge>
                    <Badge variant="outline">Family</Badge>
                    <Badge variant="outline">Neighborhood</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Story Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Word Count</span>
                    <span className="font-medium">342</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reading Time</span>
                    <span className="font-medium">2 min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sentiment</span>
                    <span className="font-medium text-success">Positive</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button className="flex-1" asChild>
            <Link to="/book/preview">Add to Book</Link>
          </Button>
          <Button variant="outline" className="flex-1">
            Share with Family
          </Button>
          <Button variant="outline" className="flex-1">
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
}