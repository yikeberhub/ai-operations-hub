import { Users, Flame, Sparkles, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/types/database.types";
import { LeadsTable } from "@/components/leads/leads-table";

type Lead = Tables<"leads">;

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-4">
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", accent)}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-2xl font-semibold leading-none tracking-tight">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  const leads = (data ?? []) as Lead[];
  const total = leads.length;
  const hot = leads.filter((l) => l.priority === "HOT").length;
  const newCount = leads.filter((l) => l.status === "new").length;
  const clientSubmitted = leads.filter((l) => l.source === "client-dashboard").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
        <p className="text-muted-foreground">
          Every inbound message — from the public contact form and client dashboard. Click a row for details.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total leads"
          value={total}
          icon={Users}
          accent="bg-primary/10 text-primary"
        />
        <StatCard
          label="Hot priority"
          value={hot}
          icon={Flame}
          accent="bg-rose-500/10 text-rose-600 dark:text-rose-400"
        />
        <StatCard
          label="Awaiting triage"
          value={newCount}
          icon={Sparkles}
          accent="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        />
        <StatCard
          label="From client portal"
          value={clientSubmitted}
          icon={UserRound}
          accent="bg-sky-500/10 text-sky-600 dark:text-sky-400"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All leads</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadsTable leads={leads} />
        </CardContent>
      </Card>
    </div>
  );
}
