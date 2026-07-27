import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database.types";
import { KnowledgeBaseTable } from "@/components/settings/knowledge-base-table";
import { AddDocumentDialog } from "@/components/settings/add-document-dialog";

type DocumentRow = Tables<"documents">;

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  const documents = (data ?? []) as DocumentRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Org settings and the knowledge base document manager.</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle>Knowledge base</CardTitle>
            <CardDescription>
              Documents the Support Agent draws on to answer questions, with source citations.
            </CardDescription>
          </div>
          <AddDocumentDialog />
        </CardHeader>
        <CardContent>
          <KnowledgeBaseTable documents={documents} />
        </CardContent>
      </Card>
    </div>
  );
}
