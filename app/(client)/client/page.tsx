import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitLead } from "@/lib/actions/leads";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My messages</h1>
        <p className="text-muted-foreground">
          Send a new support message or track the status of your previous ones.
        </p>
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
            {success && <p className="text-sm text-muted-foreground">Message sent.</p>}
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
            <p className="text-sm text-muted-foreground">You haven&apos;t sent any messages yet.</p>
          ) : (
            leads.map((lead) => (
              <div key={lead.id} className="flex items-start justify-between gap-4 border-b pb-3 last:border-0">
                <div>
                  <p className="text-sm">{lead.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(lead.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline">{lead.status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
