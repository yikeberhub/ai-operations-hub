"use client";

import { useState } from "react";
import { AppWindow, CheckCircle2, Inbox, Workflow, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/types/database.types";

type WorkflowLog = Tables<"workflow_logs">;

const STATUS_STYLES: Record<string, string> = {
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  failure: "bg-destructive/10 text-destructive",
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

export function WorkflowLogsTable({ logs }: { logs: WorkflowLog[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = logs.find((l) => l.id === selectedId) ?? null;

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Inbox className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          No workflow runs logged yet — AI triage, drafts, and n8n calls will show up here.
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Workflow</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead className="text-right">Ran</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id} className="cursor-pointer" onClick={() => setSelectedId(log.id)}>
              <TableCell className="font-medium">{log.workflow_name}</TableCell>
              <TableCell>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  {log.source === "n8n" ? (
                    <Workflow className="size-3.5" />
                  ) : (
                    <AppWindow className="size-3.5" />
                  )}
                  {log.source}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={cn("gap-1 border-0 capitalize", STATUS_STYLES[log.status])}>
                  {log.status === "success" ? (
                    <CheckCircle2 data-icon="inline-start" />
                  ) : (
                    <XCircle data-icon="inline-start" />
                  )}
                  {log.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground tabular-nums">
                {log.duration_ms !== null ? `${log.duration_ms}ms` : "—"}
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {timeAgo(log.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader className="border-b">
                <SheetTitle>{selected.workflow_name}</SheetTitle>
                <SheetDescription>
                  {selected.source} · {new Date(selected.created_at).toLocaleString()}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 overflow-y-auto p-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Payload</p>
                  <pre className="mt-1.5 overflow-x-auto rounded-lg bg-muted/50 p-3 text-xs">
                    {JSON.stringify(selected.payload, null, 2)}
                  </pre>
                </div>
                {selected.error_details !== null && (
                  <div>
                    <p className="text-xs text-muted-foreground">Error details</p>
                    <pre className="mt-1.5 overflow-x-auto rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                      {JSON.stringify(selected.error_details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
