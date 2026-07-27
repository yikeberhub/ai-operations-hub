import Link from "next/link";
import { Users, Mail, MessageSquareText, ScrollText, Flame, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { cn } from "@/lib/utils";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

type ActivityItem = {
  id: string;
  createdAt: string;
  icon: React.ElementType;
  iconClass: string;
  title: string;
  subtitle: string;
  href: string;
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const [leadsRes, emailsRes, sessionsRes, logsRes] = await Promise.all([
    supabase.from("leads").select("id, full_name, priority, status, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("emails").select("id, from_address, subject, category, status, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("chat_sessions").select("id, title, escalated, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("workflow_logs").select("id, workflow_name, status, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  const [leadStats, emailStats, sessionStats, logStats] = await Promise.all([
    supabase.from("leads").select("priority", { count: "exact", head: true }),
    supabase.from("emails").select("status", { count: "exact", head: true }),
    supabase.from("chat_sessions").select("escalated", { count: "exact", head: true }),
    supabase.from("workflow_logs").select("status", { count: "exact", head: true }),
  ]);

  const { count: hotLeadsCount } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("priority", "HOT");

  const { count: escalatedCount } = await supabase
    .from("chat_sessions")
    .select("id", { count: "exact", head: true })
    .eq("escalated", true);

  const activity: ActivityItem[] = [
    ...(leadsRes.data ?? []).map((l) => ({
      id: `lead-${l.id}`,
      createdAt: l.created_at,
      icon: Users,
      iconClass: "bg-primary/10 text-primary",
      title: `New lead: ${l.full_name}`,
      subtitle: l.priority ? `${l.priority} priority · ${l.status}` : l.status,
      href: "/leads",
    })),
    ...(emailsRes.data ?? []).map((e) => ({
      id: `email-${e.id}`,
      createdAt: e.created_at,
      icon: Mail,
      iconClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
      title: e.subject || `Email from ${e.from_address}`,
      subtitle: e.category ? `${e.category} · ${e.status}` : e.status,
      href: "/email-intelligence",
    })),
    ...(sessionsRes.data ?? []).map((s) => ({
      id: `chat-${s.id}`,
      createdAt: s.created_at,
      icon: MessageSquareText,
      iconClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      title: s.title || "Support agent conversation",
      subtitle: s.escalated ? "Escalated to human" : "Handled by AI",
      href: "/support-agent",
    })),
    ...(logsRes.data ?? []).map((w) => ({
      id: `log-${w.id}`,
      createdAt: w.created_at,
      icon: ScrollText,
      iconClass:
        w.status === "success"
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      title: w.workflow_name,
      subtitle: w.status,
      href: "/workflow-logs",
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">An overview of leads, email, support, and automation health.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total leads"
          value={leadStats.count ?? 0}
          icon={Users}
          accent="bg-primary/10 text-primary"
        />
        <StatCard
          label="Hot leads"
          value={hotLeadsCount ?? 0}
          icon={Flame}
          accent="bg-rose-500/10 text-rose-600 dark:text-rose-400"
        />
        <StatCard
          label="Total emails"
          value={emailStats.count ?? 0}
          icon={Mail}
          accent="bg-sky-500/10 text-sky-600 dark:text-sky-400"
        />
        <StatCard
          label="Escalated chats"
          value={escalatedCount ?? 0}
          icon={TriangleAlert}
          accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nothing yet — activity across leads, emails, support, and workflows will show up here.
              </p>
            ) : (
              <div className="space-y-1">
                {activity.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
                  >
                    <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", item.iconClass)}>
                      <item.icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="truncate text-xs text-muted-foreground capitalize">{item.subtitle}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(item.createdAt)}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Workflow runs</span>
              <span className="font-medium tabular-nums">{logStats.count ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Chat sessions</span>
              <span className="font-medium tabular-nums">{sessionStats.count ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Escalated</span>
              <Badge variant="secondary" className="border-0 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                {escalatedCount ?? 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
