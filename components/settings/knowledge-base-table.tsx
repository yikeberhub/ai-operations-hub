"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { FileText, Loader2, Trash2, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { deleteDocument } from "@/lib/actions/documents";
import type { Tables } from "@/lib/types/database.types";

type DocumentRow = Tables<"documents">;

const STATUS_STYLES: Record<string, string> = {
  processing: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  ready: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  failed: "bg-destructive/10 text-destructive",
};

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

export function KnowledgeBaseTable({ documents }: { documents: DocumentRow[] }) {
  const [isPending, startTransition] = useTransition();

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <FileText className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          No documents yet — add one so the Support Agent has something to cite.
        </p>
      </div>
    );
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteDocument(id);
      if (result.error) toast.error(result.error);
      else toast.success("Document deleted");
    });
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Added</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell className="font-medium">{doc.title}</TableCell>
            <TableCell>
              <Badge variant="secondary" className={cn("gap-1 border-0 capitalize", STATUS_STYLES[doc.status])}>
                {doc.status === "processing" && <Loader2 data-icon="inline-start" className="animate-spin" />}
                {doc.status === "failed" && <TriangleAlert data-icon="inline-start" />}
                {doc.status}
              </Badge>
              {doc.status === "failed" && doc.error && (
                <p className="mt-1 text-xs text-destructive">{doc.error}</p>
              )}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">{timeAgo(doc.created_at)}</TableCell>
            <TableCell className="text-right">
              <Button
                size="icon-sm"
                variant="ghost"
                disabled={isPending}
                onClick={() => handleDelete(doc.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 />
                <span className="sr-only">Delete</span>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
