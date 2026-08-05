"use client";

import { useState } from "react";
import {
  Building2,
  Flame,
  Globe,
  Inbox,
  Mail,
  Phone,
  Snowflake,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/types/database.types";
import { LeadDetailSheet } from "@/components/leads/lead-detail-sheet";
import { DeleteLeadDialog } from "@/components/leads/delete-lead-dialog";

type Lead = Tables<"leads">;

const PRIORITY_STYLES: Record<string, string> = {
  HOT: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  WARM: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  COLD: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
};

const STATUS_STYLES: Record<string, string> = {
  new: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  processing: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  qualified: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  contacted: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  closed: "bg-muted text-muted-foreground",
};

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

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

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedLead = leads.find((l) => l.id === selectedId) ?? null;

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Inbox className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          No leads yet — submissions from /contact and the client portal will show up here.
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow>
            <TableHead>Contact</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Received</TableHead>
            <TableHead className="w-9" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow
              key={lead.id}
              className="cursor-pointer hover:bg-primary/3"
              onClick={() => setSelectedId(lead.id)}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar size="sm">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {initialsOf(lead.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{lead.full_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="size-3" />
                        {lead.email}
                      </span>
                      {lead.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="size-3" />
                          {lead.phone}
                        </span>
                      )}
                      {lead.company && (
                        <span className="flex items-center gap-1">
                          <Building2 className="size-3" />
                          {lead.company}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="max-w-sm whitespace-normal">
                {lead.ai_summary ? (
                  <div className="space-y-1">
                    <p className="flex items-start gap-1.5 text-sm">
                      <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      <span className="line-clamp-2">{lead.ai_summary}</span>
                    </p>
                    {lead.next_action && (
                      <p className="line-clamp-1 pl-5 text-xs text-muted-foreground">
                        Next: {lead.next_action}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {lead.message || "—"}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  {lead.source === "client-dashboard" ? (
                    <UserRound className="size-3.5" />
                  ) : (
                    <Globe className="size-3.5" />
                  )}
                  {lead.source === "client-dashboard" ? "Client portal" : "Website"}
                </span>
              </TableCell>
              <TableCell>
                {lead.priority ? (
                  <Badge variant="secondary" className={cn("gap-1 border-0", PRIORITY_STYLES[lead.priority])}>
                    {lead.priority === "HOT" ? (
                      <Flame data-icon="inline-start" />
                    ) : lead.priority === "COLD" ? (
                      <Snowflake data-icon="inline-start" />
                    ) : null}
                    {lead.priority}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {lead.score !== null ? (
                  <span className="text-sm font-medium tabular-nums">{lead.score}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={cn("border-0 capitalize", STATUS_STYLES[lead.status])}>
                  {lead.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {timeAgo(lead.created_at)}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DeleteLeadDialog
                  leadId={lead.id}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400"
                    >
                      <Trash2 />
                      <span className="sr-only">Delete lead</span>
                    </Button>
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <LeadDetailSheet
        lead={selectedLead}
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </>
  );
}
