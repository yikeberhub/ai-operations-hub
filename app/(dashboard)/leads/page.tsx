import { Users, Flame, Sparkles, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database.types";
import { LeadsTable } from "@/components/leads/leads-table";
import { LeadsToolbar } from "@/components/leads/leads-toolbar";
import { LeadsPagination } from "@/components/leads/leads-pagination";
import { StatCard } from "@/components/dashboard/stat-card";

type Lead = Tables<"leads">;

const PAGE_SIZE = 20;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    priority?: string;
    status?: string;
    source?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  const { data: allLeads } = await supabase.from("leads").select("priority, status, source");
  const total = allLeads?.length ?? 0;
  const hot = allLeads?.filter((l) => l.priority === "HOT").length ?? 0;
  const newCount = allLeads?.filter((l) => l.status === "new").length ?? 0;
  const clientSubmitted = allLeads?.filter((l) => l.source === "client-dashboard").length ?? 0;

  let query = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.priority) query = query.eq("priority", params.priority as NonNullable<Lead["priority"]>);
  if (params.status) query = query.eq("status", params.status as Lead["status"]);
  if (params.source) query = query.eq("source", params.source);
  if (params.q)
    query = query.or(
      `full_name.ilike.%${params.q}%,email.ilike.%${params.q}%,company.ilike.%${params.q}%`
    );

  const { data, count } = await query;
  const leads = (data ?? []) as Lead[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
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
          borderColor="border-t-primary/50"
        />
        <StatCard
          label="Hot priority"
          value={hot}
          icon={Flame}
          accent="bg-rose-500/10 text-rose-600 dark:text-rose-400"
          borderColor="border-t-rose-500/50"
        />
        <StatCard
          label="Awaiting triage"
          value={newCount}
          icon={Sparkles}
          accent="bg-violet-500/10 text-violet-600 dark:text-violet-400"
          borderColor="border-t-violet-500/50"
        />
        <StatCard
          label="From client portal"
          value={clientSubmitted}
          icon={UserRound}
          accent="bg-sky-500/10 text-sky-600 dark:text-sky-400"
          borderColor="border-t-sky-500/50"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All leads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LeadsToolbar />
          <LeadsTable leads={leads} />
          <LeadsPagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} />
        </CardContent>
      </Card>
    </div>
  );
}
