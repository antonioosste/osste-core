import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Users, Mic, BookOpen, DollarSign, Clock, TrendingUp,
  UserPlus, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  totalUsers: number;
  newUsersToday: number;
  totalSessions: number;
  totalStories: number;
  totalRecordingMinutes: number;
  pendingApprovals: number;
  totalGifts: number;
  totalStoryGroups: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    async function fetchStats() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const [
        { count: totalUsers },
        { count: newUsersToday },
        { count: totalSessions },
        { count: totalStories },
        { count: pendingApprovals },
        { count: totalGifts },
        { count: totalStoryGroups },
        { data: recent },
        { data: recordings },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
        supabase.from("sessions").select("*", { count: "exact", head: true }),
        supabase.from("stories").select("*", { count: "exact", head: true }),
        supabase.from("waitlist_signups").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("gift_invitations").select("*", { count: "exact", head: true }),
        supabase.from("story_groups").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("id, name, email, plan, created_at, approved, user_type").order("created_at", { ascending: false }).limit(10),
        supabase.from("recordings").select("duration_seconds"),
      ]);

      const totalMinutes = (recordings || []).reduce((sum: number, r: any) => sum + (r.duration_seconds || 0), 0) / 60;

      setStats({
        totalUsers: totalUsers || 0,
        newUsersToday: newUsersToday || 0,
        totalSessions: totalSessions || 0,
        totalStories: totalStories || 0,
        totalRecordingMinutes: Math.round(totalMinutes),
        pendingApprovals: pendingApprovals || 0,
        totalGifts: totalGifts || 0,
        totalStoryGroups: totalStoryGroups || 0,
      });
      setRecentUsers(recent || []);
      setLoading(false);
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers, icon: Users, color: "text-blue-500" },
    { label: "New Today", value: stats?.newUsersToday, icon: UserPlus, color: "text-green-500" },
    { label: "Sessions", value: stats?.totalSessions, icon: Mic, color: "text-purple-500" },
    { label: "Stories", value: stats?.totalStories, icon: BookOpen, color: "text-amber-500" },
    { label: "Recording Hours", value: stats ? Math.round(stats.totalRecordingMinutes / 60 * 10) / 10 : 0, icon: Clock, color: "text-rose-500" },
    { label: "Pending Approvals", value: stats?.pendingApprovals, icon: TrendingUp, color: "text-orange-500" },
    { label: "Gift Purchases", value: stats?.totalGifts, icon: DollarSign, color: "text-emerald-500" },
    { label: "Story Groups", value: stats?.totalStoryGroups, icon: BookOpen, color: "text-indigo-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and key metrics</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <div>
                  <p className="font-medium text-foreground text-sm">{user.name || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={user.approved ? "default" : "secondary"} className="text-xs">
                    {user.approved ? "Approved" : "Pending"}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {user.plan || "free"}
                  </Badge>
                  {user.user_type && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {user.user_type}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {user.created_at ? format(new Date(user.created_at), "MMM d") : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
