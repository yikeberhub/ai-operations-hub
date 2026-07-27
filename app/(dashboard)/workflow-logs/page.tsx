import { ScrollText, CheckCircle2, XCircle, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database.types";
import { WorkflowLogsTable } from "@/components/workflow-logs/workflow-logs-table";
import { StatCard } from "@/components/dashboard/stat-card";

type WorkflowLog = Tables<"workflow_logs">;

export default async function WorkflowLogsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workflow_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const logs = (data ?? []) as WorkflowLog[];
  const total = logs.length;
  const successCount = logs.filter((l) => l.status === "success").length;
  const failureCount = logs.filter((l) => l.status === "failure").length;
  const successRate = total > 0 ? Math.round((successCount / total) * 100) : 0;
  const durations = logs.filter((l) => l.duration_ms !== null).map((l) => l.duration_ms as number);
  const avgDuration =
    durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Workflow Logs</h1>
        <p className="text-muted-foreground">
          Execution history for AI triage, drafts, and n8n workflow runs. Click a row for details.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total runs"
          value={total}
          icon={ScrollText}
          accent="bg-primary/10 text-primary"
        />
        <StatCard
          label="Success rate"
          value={`${successRate}%`}
          icon={CheckCircle2}
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Failures"
          value={failureCount}
          icon={XCircle}
          accent="bg-rose-500/10 text-rose-600 dark:text-rose-400"
        />
        <StatCard
          label="Avg duration"
          value={`${avgDuration}ms`}
          icon={Timer}
          accent="bg-sky-500/10 text-sky-600 dark:text-sky-400"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent runs</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkflowLogsTable logs={logs} />
        </CardContent>
      </Card>
    </div>
  );
}
