import { Mail, Flame, Sparkles, CheckCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database.types";
import { EmailsTable } from "@/components/emails/emails-table";
import { LogEmailDialog } from "@/components/emails/log-email-dialog";
import { StatCard } from "@/components/dashboard/stat-card";

type EmailRow = Tables<"emails">;

export default async function EmailIntelligencePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("emails")
    .select("*")
    .order("created_at", { ascending: false });

  const emails = (data ?? []) as EmailRow[];
  const total = emails.length;
  const hot = emails.filter((e) => e.priority === "HOT").length;
  const newCount = emails.filter((e) => e.status === "new").length;
  const replied = emails.filter((e) => e.status === "replied").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Email Intelligence</h1>
          <p className="text-muted-foreground">
            Inbound email, categorized and prioritized by AI. Click a row for details.
          </p>
        </div>
        <LogEmailDialog />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total emails" value={total} icon={Mail} accent="bg-primary/10 text-primary" />
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
          label="Replied"
          value={replied}
          icon={CheckCheck}
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All emails</CardTitle>
        </CardHeader>
        <CardContent>
          <EmailsTable emails={emails} />
        </CardContent>
      </Card>
    </div>
  );
}
