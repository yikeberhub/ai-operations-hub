"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Flame,
  History,
  Send,
  Snowflake,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  updateEmailFields,
  generateEmailDraft,
  saveEmailDraft,
  sendEmailReply,
  getEmailReplyHistory,
} from "@/lib/actions/emails";
import { DeleteEmailDialog } from "@/components/emails/delete-email-dialog";
import type { Enums, Tables } from "@/lib/types/database.types";

type EmailRow = Tables<"emails">;
type ReplyLogEntry = {
  id: string;
  status: string;
  created_at: string;
  duration_ms: number | null;
  error_details: unknown;
};

const PRIORITY_STYLES: Record<string, string> = {
  HOT: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  WARM: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  COLD: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
};

const CATEGORY_OPTIONS: Enums<"email_category">[] = [
  "sales",
  "support",
  "billing",
  "spam",
  "other",
];

const STATUS_OPTIONS: Enums<"email_status">[] = ["new", "processing", "processed", "replied"];
const PRIORITY_OPTIONS: Enums<"email_priority">[] = ["HOT", "WARM", "COLD"];

function initialsOf(address: string) {
  return address.slice(0, 2).toUpperCase();
}

export function EmailDetailSheet({
  email,
  open,
  onOpenChange,
}: {
  email: EmailRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [draftReply, setDraftReply] = useState(email?.draft_reply ?? "");
  const [lastEmailId, setLastEmailId] = useState(email?.id);
  const [replyHistory, setReplyHistory] = useState<ReplyLogEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  if (email && email.id !== lastEmailId) {
    setLastEmailId(email.id);
    setDraftReply(email.draft_reply ?? "");
  }

  useEffect(() => {
    if (!email) return;
    let cancelled = false;
    setHistoryLoading(true);
    getEmailReplyHistory(email.id).then((result) => {
      if (cancelled) return;
      setReplyHistory(result.history as ReplyLogEntry[]);
      setHistoryLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email?.id]);

  if (!email) return null;

  const handleCategoryChange = (category: Enums<"email_category"> | null) => {
    if (!category) return;
    startTransition(async () => {
      const result = await updateEmailFields(email.id, { category });
      if (result.error) toast.error(result.error);
      else toast.success("Category updated");
    });
  };

  const handlePriorityChange = (priority: Enums<"email_priority"> | null) => {
    if (!priority) return;
    startTransition(async () => {
      const result = await updateEmailFields(email.id, { priority });
      if (result.error) toast.error(result.error);
      else toast.success("Priority updated");
    });
  };

  const handleStatusChange = (status: Enums<"email_status"> | null) => {
    if (!status) return;
    startTransition(async () => {
      const result = await updateEmailFields(email.id, { status });
      if (result.error) toast.error(result.error);
      else toast.success("Status updated");
    });
  };

  const handleGenerateDraft = () => {
    startTransition(async () => {
      const result = await generateEmailDraft(email.id);
      if (result.error) toast.error(result.error);
      else {
        setDraftReply(result.draftReply ?? "");
        toast.success("Draft generated");
      }
    });
  };

  const handleSaveDraft = () => {
    startTransition(async () => {
      const result = await saveEmailDraft(email.id, draftReply);
      if (result.error) toast.error(result.error);
      else toast.success("Draft saved");
    });
  };

  const handleSendReply = () => {
    startTransition(async () => {
      // Save whatever's currently in the textarea first, so edits aren't lost
      // if the admin tweaked the draft without clicking "Save draft".
      await saveEmailDraft(email.id, draftReply);
      const result = await sendEmailReply(email.id);
      if (result.error) toast.error(result.error);
      else toast.success("Reply sent");
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto data-[side=right]:sm:max-w-2xl">
        <SheetHeader className="border-b">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-primary/10 text-primary">
                {initialsOf(email.from_address)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <SheetTitle className="truncate">{email.subject || "(no subject)"}</SheetTitle>
              <SheetDescription className="truncate">{email.from_address}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <div>
            <Label className="text-xs text-muted-foreground">Body</Label>
            <p className="mt-1.5 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm">
              {email.body}
            </p>
          </div>

          {email.ai_summary && (
            <div>
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                AI summary
              </Label>
              <p className="mt-1.5 text-sm">{email.ai_summary}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select
                value={email.category ?? undefined}
                onValueChange={handleCategoryChange}
                disabled={isPending}
              >
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue placeholder="Unset" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Priority</Label>
              <Select
                value={email.priority ?? undefined}
                onValueChange={handlePriorityChange}
                disabled={isPending}
              >
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue placeholder="Unset" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      <Badge variant="secondary" className={cn("gap-1 border-0", PRIORITY_STYLES[p])}>
                        {p === "HOT" ? (
                          <Flame data-icon="inline-start" />
                        ) : p === "COLD" ? (
                          <Snowflake data-icon="inline-start" />
                        ) : null}
                        {p}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={email.status} onValueChange={handleStatusChange} disabled={isPending}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="draft-reply" className="text-xs text-muted-foreground">
                Draft reply
              </Label>
              <Button
                size="xs"
                variant="ghost"
                disabled={isPending}
                onClick={handleGenerateDraft}
                className="text-primary"
              >
                <Wand2 data-icon="inline-start" />
                {draftReply ? "Regenerate with AI" : "Generate with AI"}
              </Button>
            </div>
            <Textarea
              id="draft-reply"
              className="mt-1.5"
              rows={8}
              placeholder="No draft yet — generate one with AI, or write your own."
              value={draftReply}
              onChange={(e) => setDraftReply(e.target.value)}
            />
          </div>

          <div>
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <History className="size-3.5" />
              Reply history
            </Label>
            <div className="mt-1.5 space-y-2">
              {historyLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : replyHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No replies sent yet.</p>
              ) : (
                replyHistory.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-2 rounded-lg bg-muted/50 p-2.5">
                    {entry.status === "success" ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {entry.status === "success" ? "Reply sent" : "Send failed"}
                        <span className="ml-1.5 font-normal text-muted-foreground">
                          {new Date(entry.created_at).toLocaleString()}
                        </span>
                      </p>
                      {entry.status !== "success" && entry.error_details ? (
                        <p className="mt-0.5 truncate text-xs text-rose-600 dark:text-rose-400">
                          {typeof entry.error_details === "object" &&
                          entry.error_details !== null &&
                          "message" in entry.error_details
                            ? String((entry.error_details as { message: unknown }).message)
                            : JSON.stringify(entry.error_details)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row justify-between gap-2 border-t">
          <DeleteEmailDialog
            emailId={email.id}
            onDeleted={() => onOpenChange(false)}
            trigger={
              <Button variant="destructive">
                <Trash2 data-icon="inline-start" />
                Delete
              </Button>
            }
          />
          <div className="flex gap-2">
            <Button variant="outline" disabled={isPending} onClick={handleSaveDraft}>
              Save draft
            </Button>
            <Button
              disabled={isPending || !draftReply || email.status === "replied"}
              onClick={handleSendReply}
            >
              <Send data-icon="inline-start" />
              {email.status === "replied" ? "Replied" : "Send reply"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
