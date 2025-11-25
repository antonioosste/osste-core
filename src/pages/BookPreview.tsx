import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Download, 
  Edit, 
  GripVertical, 
  Settings, 
  FileText,
  BookOpen,
  Calendar,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Header } from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";

interface Story {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  order: number;
}

const approvedStories: Story[] = [
  {
    id: "1",
    title: "Childhood Memories in Brooklyn",
    content: `I was born in Brooklyn in 1942, right in the heart of what we called "the neighborhood." Our block was lined with brownstones, each one filled with families who knew each other's business—and I mean that in the best possible way.

The candy store on the corner was owned by Mr. Goldstein, a kind man with thick glasses who always had a smile for us kids. We'd spend our nickels on penny candy, carefully choosing each piece from the glass jars that lined the counter.

Summer meant stickball in the street. We'd use a broomstick and a pink rubber ball—what we called a "spaldeen." The manhole covers were our bases, and we'd play until the streetlights came on and our mothers called us in for dinner.

The neighborhood was alive with sounds: kids playing, mothers calling from windows, the knife sharpener's bell, and the ice cream truck playing its tinny melody. Everyone looked out for everyone else's kids.

Those were simpler times, but they were rich with community and connection. Every day was an adventure, even if it was just walking to the corner store or playing in the street until dark.`,
    wordCount: 168,
    order: 1
  },
  {
    id: "3",
    title: "Family Immigration Story",
    content: `The journey from Ellis Island to building a new life in America was not easy, but it was filled with hope and determination.

My grandparents arrived with nothing but the clothes on their backs and a dream of a better future. They didn't speak the language, didn't know the customs, but they had something more valuable than money—they had each other and an unshakeable belief in the promise of America.

The first winter was the hardest. They lived in a tiny tenement apartment with three other families. But slowly, through hard work and perseverance, they began to build their new life.

Within five years, my grandfather had saved enough to open a small grocery store. The neighborhood welcomed them, and soon they became an integral part of the community fabric.

Their story is one of courage, sacrifice, and the enduring power of the American dream.`,
    wordCount: 145,
    order: 2
  },
  {
    id: "4",
    title: "Wedding Day Memories",
    content: `It was September 15th, 1963, and despite the difficult times of the Depression, love found a way to triumph.

My grandmother wore her mother's wedding dress, carefully altered to fit. There was no money for flowers, so the women of the neighborhood gathered wildflowers from the nearby park. The ceremony was held in the small church on the corner, the same one where I would later be baptized.

The reception was in the church basement, with tables made from wooden planks and sawhorses. But what it lacked in elegance, it made up for in joy. The whole neighborhood came together to celebrate, bringing dishes from their own kitchens.

They danced to music from an old radio, and when it broke halfway through the evening, Uncle Tony played his accordion. The party went on until dawn, and even though times were hard, nobody wanted the magic to end.

That wedding taught me that happiness doesn't come from having the most expensive things—it comes from being surrounded by people who care about you.`,
    wordCount: 189,
    order: 3
  }
];

export default function BookPreview() {
  const { toast } = useToast();
  const [stories, setStories] = useState(approvedStories);
  const [bookDetails, setBookDetails] = useState({
    title: "Family Stories & Memories",
    subtitle: "A Collection of Life's Most Precious Moments",
    author: "John Smith Family",
    year: "2024"
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const totalWords = stories.reduce((sum, story) => sum + story.wordCount, 0);
  const estimatedPages = Math.ceil(totalWords / 250); // ~250 words per page

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedItem === null) return;

    const newStories = [...stories];
    const draggedStory = newStories[draggedItem];
    
    // Remove from old position
    newStories.splice(draggedItem, 1);
    
    // Insert at new position
    newStories.splice(dropIndex, 0, draggedStory);
    
    // Update order numbers
    const updatedStories = newStories.map((story, index) => ({
      ...story,
      order: index + 1
    }));
    
    setStories(updatedStories);
    setDraggedItem(null);
    
    toast({
      title: "Chapter order updated",
      description: "The chapters have been reordered successfully."
    });
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const storyIds = stories.map(s => s.id);
      
      if (storyIds.length < 2) {
        throw new Error("Provide at least two stories to compile.");
      }

      // Simulate PDF generation process (replace with actual API endpoint)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const jobId = `job_${Math.random().toString(36).slice(2)}`;
      
      toast({
        title: "PDF Generated",
        description: `PDF job queued (jobId: ${jobId}). You'll see it under Downloads when it's finished.`
      });
      
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error?.message ?? "Something went wrong generating the book.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getPageNumber = (storyIndex: number) => {
    // Title page = 1, TOC = 2, stories start at page 3
    let page = 3;
    for (let i = 0; i < storyIndex; i++) {
      page += Math.ceil(stories[i].wordCount / 250);
    }
    return page;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/stories">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Stories
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Book Preview</h1>
              <p className="text-muted-foreground">
                6×9 format • {estimatedPages} pages • {totalWords} words
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Edit className="w-4 h-4" />
                  Edit Details
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Book Details</DialogTitle>
                  <DialogDescription>
                    Customize your book's title page information
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Book Title</Label>
                    <Input
                      id="title"
                      value={bookDetails.title}
                      onChange={(e) => setBookDetails(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="subtitle">Subtitle</Label>
                    <Input
                      id="subtitle"
                      value={bookDetails.subtitle}
                      onChange={(e) => setBookDetails(prev => ({ ...prev, subtitle: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="author">Author</Label>
                    <Input
                      id="author"
                      value={bookDetails.author}
                      onChange={(e) => setBookDetails(prev => ({ ...prev, author: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      value={bookDetails.year}
                      onChange={(e) => setBookDetails(prev => ({ ...prev, year: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setShowDetailsDialog(false)}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button onClick={generatePDF} disabled={isGenerating} className="gap-2">
              <Download className="w-4 h-4" />
              {isGenerating ? "Generating..." : "Generate PDF"}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Chapter Order Panel */}
          <div className="lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GripVertical className="w-5 h-5" />
                  Chapter Order
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Drag to reorder chapters
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {stories.map((story, index) => (
                  <div
                    key={story.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className="flex items-center gap-3 p-3 bg-muted rounded-lg cursor-move hover:bg-muted/80 transition-colors"
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{story.order}. {story.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {story.wordCount} words • Page {getPageNumber(index)}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Book Preview */}
          <div className="lg:col-span-8">
            <div className="bg-white shadow-2xl mx-auto" style={{ 
              width: '480px', 
              aspectRatio: '6/9',
              fontFamily: 'Crimson Text, Georgia, serif'
            }}>
              {/* Title Page */}
              <div className="h-full p-12 flex flex-col justify-center items-center text-center border-b border-gray-200">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h1 className="text-3xl font-serif font-semibold text-gray-900 leading-tight">
                      {bookDetails.title}
                    </h1>
                    <h2 className="text-lg font-serif italic text-gray-700">
                      {bookDetails.subtitle}
                    </h2>
                  </div>
                  
                  <div className="w-24 h-px bg-gray-400 mx-auto"></div>
                  
                  <div className="space-y-2">
                    <p className="text-base font-serif text-gray-800">
                      {bookDetails.author}
                    </p>
                    <p className="text-sm font-serif text-gray-600">
                      {bookDetails.year}
                    </p>
                  </div>
                </div>
                
                <div className="absolute bottom-8 text-xs text-gray-500">
                  Page 1
                </div>
              </div>
            </div>

            {/* Table of Contents Preview */}
            <div className="bg-white shadow-2xl mx-auto mt-6" style={{ 
              width: '480px', 
              aspectRatio: '6/9',
              fontFamily: 'Crimson Text, Georgia, serif'
            }}>
              <div className="h-full p-12">
                <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-8 text-center">
                  Table of Contents
                </h2>
                
                <div className="space-y-4">
                  {stories.map((story, index) => (
                    <div key={story.id} className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-serif text-base text-gray-900">
                          Chapter {story.order}: {story.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <div className="border-b border-dotted border-gray-400 flex-1 min-w-[20px]"></div>
                        <span className="text-sm text-gray-600 font-serif">
                          {getPageNumber(index)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="absolute bottom-8 text-xs text-gray-500">
                  Page 2
                </div>
              </div>
            </div>

            {/* Sample Chapter Preview */}
            <div className="bg-white shadow-2xl mx-auto mt-6" style={{ 
              width: '480px', 
              aspectRatio: '6/9',
              fontFamily: 'Crimson Text, Georgia, serif'
            }}>
              <div className="h-full p-12">
                <h2 className="text-xl font-serif font-semibold text-gray-900 mb-8 text-center">
                  Chapter 1
                </h2>
                
                <h3 className="text-lg font-serif font-semibold text-gray-900 mb-6 text-center">
                  {stories[0]?.title}
                </h3>
                
                <div className="space-y-4 text-sm leading-relaxed text-gray-800 font-serif">
                  {stories[0]?.content.split('\n\n').slice(0, 3).map((paragraph, index) => (
                    <p key={index} className="indent-8">
                      {paragraph}
                    </p>
                  ))}
                  <p className="text-center text-gray-500 italic">
                    ...continued
                  </p>
                </div>
                
                <div className="absolute bottom-8 text-xs text-gray-500">
                  Page 3
                </div>
              </div>
            </div>

            <div className="text-center mt-6 text-sm text-muted-foreground">
              This is a preview of your book layout. The final PDF will include all chapters.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}