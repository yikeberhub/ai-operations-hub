import { Inbox, MessageSquareText, Clock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatCard } from "@/components/dashboard/stat-card";
import { submitLead } from "@/lib/actions/leads";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  new: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  processing: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  qualified: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  contacted: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  closed: "bg-muted text-muted-foreground",
};

export default async function ClientDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: leads } = await supabase
    .from("leads")
    .select("id, message, status, created_at")
    .eq("client_id", user!.id)
    .order("created_at", { ascending: false });

  const total = leads?.length ?? 0;
  const pending = leads?.filter((l) => l.status === "new" || l.status === "processing").length ?? 0;
  const resolved = leads?.filter((l) => l.status === "closed").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">My messages</h1>
        <p className="text-muted-foreground">
          Send a new support message or track the status of your previous ones.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total messages"
          value={total}
          icon={MessageSquareText}
          accent="bg-primary/10 text-primary"
          borderColor="border-t-primary/50"
        />
        <StatCard
          label="Pending"
          value={pending}
          icon={Clock}
          accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          borderColor="border-t-amber-500/50"
        />
        <StatCard
          label="Resolved"
          value={resolved}
          icon={CheckCircle2}
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          borderColor="border-t-emerald-500/50"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New message</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={submitLead} className="space-y-4">
            <input type="hidden" name="redirectTo" value="/client" />
            <input type="hidden" name="fullName" value={user?.user_metadata?.full_name ?? ""} />
            <input type="hidden" name="email" value={user?.email ?? ""} />
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" name="message" required rows={4} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-emerald-600 dark:text-emerald-400">Message sent.</p>}
            <Button type="submit">Send message</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!leads || leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Inbox className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">You haven&apos;t sent any messages yet.</p>
            </div>
          ) : (
            leads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-start justify-between gap-4 rounded-lg bg-muted/40 p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm">{lead.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(lead.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant="secondary" className={cn("shrink-0 border-0 capitalize", STATUS_STYLES[lead.status])}>
                  {lead.status}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
