import { useState } from "react";
import { ArrowLeft, Download, Share2, Edit, Plus, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";

const bookStories = [
  {
    id: "1",
    title: "Childhood Memories in Brooklyn",
    summary: "Growing up in 1950s Brooklyn neighborhood",
    order: 1,
  },
  {
    id: "3",
    title: "Family Immigration Story", 
    summary: "The journey from Ellis Island to America",
    order: 2,
  },
  {
    id: "4",
    title: "Wedding Day Memories",
    summary: "How grandparents met during the Depression",
    order: 3,
  },
];

export default function BookPreview() {
  const [bookTitle, setBookTitle] = useState("The Johnson Family Stories");
  const [bookDescription, setBookDescription] = useState("A collection of memories spanning three generations, from immigration to childhood in Brooklyn.");
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link to="/stories">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Stories
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Book Preview */}
          <div className="lg:col-span-2">
            {/* Book Cover */}
            <Card className="mb-8">
              <CardContent className="p-8">
                <div className="bg-gradient-to-br from-primary to-primary/80 rounded-lg p-8 text-white min-h-[400px] flex flex-col justify-center">
                  <div className="text-center">
                    {isEditing ? (
                      <div className="space-y-4">
                        <Input
                          value={bookTitle}
                          onChange={(e) => setBookTitle(e.target.value)}
                          className="text-center text-white bg-white/20 border-white/30 placeholder:text-white/70"
                          placeholder="Book Title"
                        />
                        <Textarea
                          value={bookDescription}
                          onChange={(e) => setBookDescription(e.target.value)}
                          className="text-center text-white bg-white/20 border-white/30 placeholder:text-white/70 resize-none"
                          placeholder="Book Description"
                          rows={3}
                        />
                      </div>
                    ) : (
                      <>
                        <h1 className="text-4xl font-bold mb-4">{bookTitle}</h1>
                        <p className="text-xl opacity-90 mb-8">{bookDescription}</p>
                      </>
                    )}
                    <div className="text-sm opacity-75">
                      Compiled by OSSTE • {new Date().getFullYear()}
                    </div>
                  </div>
                </div>
                <div className="flex justify-center mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {isEditing ? "Save" : "Edit Cover"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Story List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Stories in Book ({bookStories.length})
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Story
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookStories.map((story, index) => (
                    <div
                      key={story.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {story.order}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{story.title}</h4>
                          <p className="text-sm text-muted-foreground">{story.summary}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Book Details */}
            <Card>
              <CardHeader>
                <CardTitle>Book Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Pages</p>
                    <p className="font-medium">24</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Stories</p>
                    <p className="font-medium">{bookStories.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Word Count</p>
                    <p className="font-medium">8,450</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Read Time</p>
                    <p className="font-medium">35 min</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Format Options */}
            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Format</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">PDF</Button>
                    <Button variant="outline" size="sm">EPUB</Button>
                    <Button variant="outline" size="sm">Word</Button>
                    <Button variant="outline" size="sm">Print</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Page Size</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">A4</Button>
                    <Button variant="outline" size="sm">Letter</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button className="w-full" asChild>
                <Link to="/checkout">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Book ($9.99)
                </Link>
              </Button>
              <Button variant="outline" className="w-full">
                <Share2 className="w-4 h-4 mr-2" />
                Share Preview
              </Button>
              <Button variant="outline" className="w-full">
                Save as Draft
              </Button>
            </div>

            {/* Upgrade Notice */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="text-center">
                  <h4 className="font-medium text-foreground mb-2">Premium Features</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upgrade to access professional layouts, photo integration, and unlimited books.
                  </p>
                  <Button size="sm" asChild>
                    <Link to="/pricing">Upgrade Plan</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}