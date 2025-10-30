import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, RefreshCw, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const AdminQuestions = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedDepth, setSelectedDepth] = useState<string>("All");
  const [searchText, setSearchText] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

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

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const rows = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const row: any = {};
          headers.forEach((header, i) => {
            row[header] = values[i];
          });
          return row;
        });

      // Batch insert in chunks of 300
      const chunkSize = 300;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { error } = await supabase.from('questions').insert(chunk);
        if (error) throw error;
      }

      toast.success(`Imported ${rows.length} questions successfully`);
      fetchQuestions();
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast.error('Failed to import CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleJSONUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const rows: any[] = [];
      Object.entries(data).forEach(([type, prompts]) => {
        (prompts as string[]).forEach(prompt => {
          rows.push({ type, prompt });
        });
      });

      const { error } = await supabase.from('followup_templates').insert(rows);
      if (error) throw error;

      toast.success(`Imported ${rows.length} followup templates successfully`);
    } catch (error) {
      console.error('Error importing JSON:', error);
      toast.error('Failed to import JSON');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      let query = supabase.from('questions').select('*');

      if (selectedCategory !== "All") {
        query = query.eq('category', selectedCategory);
      }

      if (selectedDepth !== "All") {
        query = query.eq('depth_level', parseInt(selectedDepth));
      }

      if (searchText) {
        query = query.ilike('question', `%${searchText}%`);
      }

      const { data, error } = await query.order('id');
      if (error) throw error;

      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (selectedRows.size === 0) return;

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .in('id', Array.from(selectedRows));

      if (error) throw error;

      toast.success(`Deleted ${selectedRows.size} questions`);
      setSelectedRows(new Set());
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting questions:', error);
      toast.error('Failed to delete questions');
    }
  };

  const toggleRow = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="font-serif text-4xl font-bold mb-8">Question Bank Admin</h1>

        <div className="grid gap-6 mb-8">
          <Card className="p-6">
            <h2 className="font-serif text-2xl font-semibold mb-4">Import Data</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="csv-upload" className="mb-2 block">
                  Upload Questions CSV
                </Label>
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="json-upload" className="mb-2 block">
                  Upload Followup Templates JSON
                </Label>
                <Input
                  id="json-upload"
                  type="file"
                  accept=".json"
                  onChange={handleJSONUpload}
                  disabled={loading}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-serif text-2xl font-semibold mb-4">Filter Questions</h2>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label htmlFor="category" className="mb-2 block">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category">
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
                <Label htmlFor="depth" className="mb-2 block">Depth Level</Label>
                <Select value={selectedDepth} onValueChange={setSelectedDepth}>
                  <SelectTrigger id="depth">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="1">1 - Light</SelectItem>
                    <SelectItem value="2">2 - Reflective</SelectItem>
                    <SelectItem value="3">3 - Deep</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="search" className="mb-2 block">Search Question</Label>
                <Input
                  id="search"
                  type="text"
                  placeholder="Search..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={fetchQuestions} disabled={loading}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Load Questions
                </Button>
              </div>
            </div>
          </Card>

          {questions.length > 0 && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-serif text-2xl font-semibold">
                  Questions ({questions.length})
                </h2>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={selectedRows.size === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedRows.size})
                </Button>
              </div>
              <div className="rounded-md border overflow-auto max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Select</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="min-w-[300px]">Question</TableHead>
                      <TableHead>Depth</TableHead>
                      <TableHead>Emotion Tags</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map((q) => (
                      <TableRow key={q.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedRows.has(q.id)}
                            onCheckedChange={() => toggleRow(q.id)}
                          />
                        </TableCell>
                        <TableCell>{q.id}</TableCell>
                        <TableCell className="text-sm">{q.category}</TableCell>
                        <TableCell className="text-sm">{q.question}</TableCell>
                        <TableCell>{q.depth_level}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {q.emotion_tags}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminQuestions;