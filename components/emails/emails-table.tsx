"use client";

import { useState } from "react";
import { Inbox, Sparkles, Tag, Trash2 } from "lucide-react";
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
import { EmailDetailSheet } from "@/components/emails/email-detail-sheet";
import { DeleteEmailDialog } from "@/components/emails/delete-email-dialog";

type EmailRow = Tables<"emails">;

const PRIORITY_STYLES: Record<string, string> = {
  HOT: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  WARM: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  COLD: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
};

const STATUS_STYLES: Record<string, string> = {
  new: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  processing: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  processed: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  replied: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

const CATEGORY_STYLES: Record<string, string> = {
  sales: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  support: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  billing: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  spam: "bg-muted text-muted-foreground",
  other: "bg-muted text-muted-foreground",
};

const SENTIMENT_EMOJI: Record<string, string> = {
  Positive: "😊",
  Neutral: "😐",
  Negative: "😡",
};

function initialsOf(address: string) {
  return address.slice(0, 2).toUpperCase();
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

export function EmailsTable({ emails }: { emails: EmailRow[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedEmail = emails.find((e) => e.id === selectedId) ?? null;

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Inbox className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          No emails yet — log one manually, or connect the n8n mail-polling workflow.
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow>
            <TableHead>From</TableHead>
            <TableHead>Subject / summary</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Received</TableHead>
            <TableHead className="w-9" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {emails.map((email) => (
            <TableRow
              key={email.id}
              className="cursor-pointer hover:bg-primary/3"
              onClick={() => setSelectedId(email.id)}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar size="sm">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {initialsOf(email.from_address)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="truncate text-sm font-medium">{email.from_address}</p>
                </div>
              </TableCell>
              <TableCell className="max-w-sm whitespace-normal">
                <p className="truncate text-sm font-medium">{email.subject || "(no subject)"}</p>
                {email.ai_summary ? (
                  <p className="mt-0.5 flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Sparkles className="mt-0.5 size-3 shrink-0 text-primary" />
                    <span className="line-clamp-1">{email.ai_summary}</span>
                  </p>
                ) : (
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{email.body}</p>
                )}
              </TableCell>
              <TableCell>
                {email.category ? (
                  <Badge variant="secondary" className={cn("gap-1 border-0 capitalize", CATEGORY_STYLES[email.category])}>
                    <Tag data-icon="inline-start" />
                    {email.category}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  {email.priority ? (
                    <Badge variant="secondary" className={cn("border-0", PRIORITY_STYLES[email.priority])}>
                      {email.priority}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                  {email.sentiment && (
                    <span title={`Sentiment: ${email.sentiment}`} className="text-sm">
                      {SENTIMENT_EMOJI[email.sentiment]}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={cn("border-0 capitalize", STATUS_STYLES[email.status])}>
                  {email.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {timeAgo(email.created_at)}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DeleteEmailDialog
                  emailId={email.id}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400"
                    >
                      <Trash2 />
                      <span className="sr-only">Delete email</span>
                    </Button>
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <EmailDetailSheet
        email={selectedEmail}
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </>
  );
}
