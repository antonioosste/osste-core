import { useState, useEffect } from "react";
import { BarChart3, Loader2, Mic, Users, BookOpen, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--muted-foreground))", "#f59e0b", "#10b981", "#ef4444"];

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [planDist, setPlanDist] = useState<any[]>([]);
  const [sessionsByDay, setSessionsByDay] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ avgDuration: 0, totalMinutes: 0, totalSessions: 0 });

  useEffect(() => {
    async function fetch() {
      // Plan distribution
      const { data: profiles } = await supabase.from("profiles").select("plan");
      const planCounts: Record<string, number> = {};
      (profiles || []).forEach((p: any) => {
        const plan = p.plan || "free";
        planCounts[plan] = (planCounts[plan] || 0) + 1;
      });
      setPlanDist(Object.entries(planCounts).map(([name, value]) => ({ name, value })));

      // Sessions by day (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: sessions } = await supabase
        .from("sessions")
        .select("started_at")
        .gte("started_at", thirtyDaysAgo.toISOString());

      const dayCounts: Record<string, number> = {};
      (sessions || []).forEach((s: any) => {
        if (s.started_at) {
          const day = s.started_at.slice(0, 10);
          dayCounts[day] = (dayCounts[day] || 0) + 1;
        }
      });
      const sortedDays = Object.entries(dayCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date: date.slice(5), count }));
      setSessionsByDay(sortedDays);

      // Recording stats
      const { data: recordings } = await supabase.from("recordings").select("duration_seconds, session_id");
      const totalSec = (recordings || []).reduce((sum: number, r: any) => sum + (r.duration_seconds || 0), 0);
      const avgSec = recordings?.length ? totalSec / recordings.length : 0;

      setStats({
        avgDuration: Math.round(avgSec / 60),
        totalMinutes: Math.round(totalSec / 60),
        totalSessions: sessions?.length || 0,
      });

      // Top users by session count
      const userSessionCount: Record<string, number> = {};
      (sessions || []).forEach((s: any) => {
        userSessionCount[s.user_id] = (userSessionCount[s.user_id] || 0) + 1;
      });
      // We don't have user_id in sessions query above - let me get it
      const { data: sessionsWithUser } = await supabase
        .from("sessions")
        .select("user_id")
        .gte("started_at", thirtyDaysAgo.toISOString());
      
      const userCounts: Record<string, number> = {};
      (sessionsWithUser || []).forEach((s: any) => {
        userCounts[s.user_id] = (userCounts[s.user_id] || 0) + 1;
      });
      
      const topUserIds = Object.entries(userCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([id, count]) => ({ id, count }));

      if (topUserIds.length > 0) {
        const { data: userProfiles } = await supabase
          .from("profiles")
          .select("id, name, email")
          .in("id", topUserIds.map((u) => u.id));
        const profileMap = new Map((userProfiles || []).map((p: any) => [p.id, p]));
        setTopUsers(topUserIds.map((u) => ({
          ...u,
          name: profileMap.get(u.id)?.name || "Unknown",
          email: profileMap.get(u.id)?.email || "",
        })));
      }

      setLoading(false);
    }
    fetch();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Platform usage and engagement metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <Clock className="h-10 w-10 text-primary opacity-80" />
            <div>
              <p className="text-sm text-muted-foreground">Total Recording Minutes</p>
              <p className="text-2xl font-bold">{stats.totalMinutes}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <Mic className="h-10 w-10 text-purple-500 opacity-80" />
            <div>
              <p className="text-sm text-muted-foreground">Avg Recording Length</p>
              <p className="text-2xl font-bold">{stats.avgDuration} min</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <Users className="h-10 w-10 text-blue-500 opacity-80" />
            <div>
              <p className="text-sm text-muted-foreground">Sessions (30d)</p>
              <p className="text-2xl font-bold">{stats.totalSessions}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sessions by Day Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Daily Sessions (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessionsByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={sessionsByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No session data</p>
            )}
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Plan Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {planDist.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={planDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                      {planDist.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {planDist.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm capitalize">{p.name}: {p.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Most Active Users (30d)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topUsers.map((u, i) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground w-6">#{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <span className="text-sm font-bold">{u.count} sessions</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
