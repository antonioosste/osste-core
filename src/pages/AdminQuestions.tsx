import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminPagination, paginate, usePagination } from "@/components/admin/AdminPagination";

const AdminQuestions = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchText, setSearchText] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const categories = [
    "All", "Childhood & Early Memories", "Family & Home Life", "School & Learning",
    "Friendships & Social Life", "First Experiences", "Teenage Years", "Work & Career",
    "Love & Relationships", "Parenthood & Family Building", "Travel & Adventure",
    "Hardship, Loss & Healing", "Identity & Self-Discovery", "Hobbies & Passions",
    "Community & Belonging", "Turning Points", "Wisdom & Reflection",
    "Dreams & Aspirations", "Cultural & Spiritual Life", "Legacy & Values"
  ];

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: any = {};
        headers.forEach((header, i) => { row[header] = values[i]; });
        return row;
      });
      for (let i = 0; i < rows.length; i += 300) {
        const { error } = await supabase.from('questions').insert(rows.slice(i, i + 300));
        if (error) throw error;
      }
      toast.success(`Imported ${rows.length} questions successfully`);
      fetchQuestions();
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast.error('Failed to import CSV');
    } finally { setLoading(false); }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      let query = supabase.from('questions').select('*');
      if (selectedCategory !== "All") query = query.eq('category_id', selectedCategory);
      if (searchText) query = query.ilike('question_text', `%${searchText}%`);
      const { data, error } = await query.order('id');
      if (error) throw error;
      setQuestions(data || []);
      setPage(1);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to fetch questions');
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (selectedRows.size === 0) return;
    try {
      const { error } = await supabase.from('questions').delete().in('id', Array.from(selectedRows));
      if (error) throw error;
      toast.success(`Deleted ${selectedRows.size} questions`);
      setSelectedRows(new Set());
      fetchQuestions();
    } catch (error) {
      toast.error('Failed to delete questions');
    }
  };

  const toggleRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) newSelected.delete(id); else newSelected.add(id);
    setSelectedRows(newSelected);
  };

  const { totalPages, pageSize, totalItems } = usePagination(questions, 25);
  const paged = paginate(questions, page, 25);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Question Bank Admin</h1>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Import Data</h2>
        <div>
          <Label htmlFor="csv-upload" className="mb-2 block">Upload Questions CSV</Label>
          <Input id="csv-upload" type="file" accept=".csv" onChange={handleCSVUpload} disabled={loading} />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Filter Questions</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <Label className="mb-2 block">Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">Search</Label>
            <Input placeholder="Search..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={fetchQuestions} disabled={loading}><RefreshCw className="w-4 h-4 mr-2" /> Load</Button>
          </div>
        </div>
      </Card>

      {questions.length > 0 && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Questions ({questions.length})</h2>
            <Button variant="destructive" onClick={handleDelete} disabled={selectedRows.size === 0}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete Selected ({selectedRows.size})
            </Button>
          </div>
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Select</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Difficulty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell><Checkbox checked={selectedRows.has(q.id)} onCheckedChange={() => toggleRow(q.id)} /></TableCell>
                    <TableCell className="text-sm">{q.question_text}</TableCell>
                    <TableCell className="text-sm">{q.category_id || "—"}</TableCell>
                    <TableCell>{q.difficulty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={pageSize} />
        </Card>
      )}
    </div>
  );
};

export default AdminQuestions;
