import { useState, useEffect } from "react";
import { format } from "date-fns";
import { BookOpen, Loader2, Search, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface StoryRow {
  id: string;
  title: string | null;
  raw_text: string | null;
  edited_text: string | null;
  approved: boolean | null;
  created_at: string | null;
  story_group_id: string | null;
  group_title?: string;
  user_name?: string;
}

export default function AdminStories() {
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<StoryRow | null>(null);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("stories")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (data) {
        const groupIds = [...new Set(data.map((s: any) => s.story_group_id).filter(Boolean))];
        const { data: groups } = await supabase
          .from("story_groups")
          .select("id, title, user_id")
          .in("id", groupIds);
        const groupMap = new Map((groups || []).map((g: any) => [g.id, g]));

        const userIds = [...new Set((groups || []).map((g: any) => g.user_id))];
        const { data: profiles } = await supabase.from("profiles").select("id, name").in("id", userIds);
        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

        setStories(data.map((s: any) => {
          const group = groupMap.get(s.story_group_id);
          return {
            ...s,
            group_title: group?.title || "—",
            user_name: profileMap.get(group?.user_id)?.name || "Unknown",
          };
        }));
      }
      setLoading(false);
    }
    fetch();
  }, []);

  const filtered = stories.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.title?.toLowerCase().includes(q) || s.user_name?.toLowerCase().includes(q);
  });

  const wordCount = (text: string | null) => text ? text.split(/\s+/).length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Stories & Books</h1>
        <p className="text-muted-foreground">View all generated stories</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search stories..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> Stories ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Words</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((story) => (
                    <TableRow key={story.id}>
                      <TableCell className="font-medium text-sm max-w-[200px] truncate">{story.title || "Untitled"}</TableCell>
                      <TableCell className="text-sm">{story.user_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{story.group_title}</TableCell>
                      <TableCell className="text-sm">{wordCount(story.edited_text || story.raw_text)}</TableCell>
                      <TableCell>
                        <Badge variant={story.approved ? "default" : "secondary"} className="text-xs">
                          {story.approved ? "Approved" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {story.created_at ? format(new Date(story.created_at), "MMM d, yyyy") : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => setSelected(story)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{selected?.title || "Untitled Story"}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div><strong>User:</strong> {selected.user_name}</div>
              <div><strong>Group:</strong> {selected.group_title}</div>
              <div><strong>Words:</strong> {wordCount(selected.edited_text || selected.raw_text)}</div>
              {(selected.edited_text || selected.raw_text) && (
                <div className="bg-muted/50 rounded-md p-4 max-h-96 overflow-auto whitespace-pre-wrap text-sm">
                  {selected.edited_text || selected.raw_text}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
