import { Mail, Flame, Sparkles, CheckCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database.types";
import { EmailsTable } from "@/components/emails/emails-table";
import { EmailsToolbar } from "@/components/emails/emails-toolbar";
import { EmailsPagination } from "@/components/emails/emails-pagination";
import { SentimentCharts } from "@/components/emails/sentiment-charts";
import { LogEmailDialog } from "@/components/emails/log-email-dialog";
import { StatCard } from "@/components/dashboard/stat-card";

type EmailRow = Tables<"emails">;

const PAGE_SIZE = 20;

export default async function EmailIntelligencePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    priority?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  // Stat cards reflect the full inbox regardless of active filters.
  const { data: allEmails } = await supabase.from("emails").select("priority, status");
  const total = allEmails?.length ?? 0;
  const hot = allEmails?.filter((e) => e.priority === "HOT").length ?? 0;
  const newCount = allEmails?.filter((e) => e.status === "new").length ?? 0;
  const replied = allEmails?.filter((e) => e.status === "replied").length ?? 0;

  let query = supabase
    .from("emails")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.category)
    query = query.eq("category", params.category as NonNullable<EmailRow["category"]>);
  if (params.priority)
    query = query.eq("priority", params.priority as NonNullable<EmailRow["priority"]>);
  if (params.status) query = query.eq("status", params.status as EmailRow["status"]);
  if (params.q) query = query.or(`from_address.ilike.%${params.q}%,subject.ilike.%${params.q}%`);

  const { data, count } = await query;
  const emails = (data ?? []) as EmailRow[];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Intelligence</h1>
          <p className="text-muted-foreground">
            Inbound email, categorized and prioritized by AI. Click a row for details.
          </p>
        </div>
        <LogEmailDialog />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total emails"
          value={total}
          icon={Mail}
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
          label="Replied"
          value={replied}
          icon={CheckCheck}
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          borderColor="border-t-emerald-500/50"
        />
      </div>

      <SentimentCharts />

      <Card>
        <CardHeader>
          <CardTitle>All emails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EmailsToolbar />
          <EmailsTable emails={emails} />
          <EmailsPagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} />
        </CardContent>
      </Card>
    </div>
  );
}
