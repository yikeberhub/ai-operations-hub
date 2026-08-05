"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Building2,
  Flame,
  Mail,
  Phone,
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
  updateLeadFields,
  generateDraftReply,
  saveDraftReply,
  sendLeadReply,
} from "@/lib/actions/leads";
import { DeleteLeadDialog } from "@/components/leads/delete-lead-dialog";
import type { Enums, Tables } from "@/lib/types/database.types";

type Lead = Tables<"leads">;

const PRIORITY_STYLES: Record<string, string> = {
  HOT: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  WARM: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  COLD: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
};

const STATUS_OPTIONS: Enums<"lead_status">[] = [
  "new",
  "processing",
  "qualified",
  "contacted",
  "closed",
];

const PRIORITY_OPTIONS: Enums<"lead_priority">[] = ["HOT", "WARM", "COLD"];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function LeadDetailSheet({
  lead,
  open,
  onOpenChange,
}: {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [nextAction, setNextAction] = useState(lead?.next_action ?? "");
  const [draftEmail, setDraftEmail] = useState(lead?.draft_email ?? "");
  const [lastLeadId, setLastLeadId] = useState(lead?.id);

  // Keep local editable fields in sync when a different lead is opened.
  if (lead && lead.id !== lastLeadId) {
    setLastLeadId(lead.id);
    setNextAction(lead.next_action ?? "");
    setDraftEmail(lead.draft_email ?? "");
  }

  if (!lead) return null;

  const handleStatusChange = (status: Enums<"lead_status"> | null) => {
    if (!status) return;
    startTransition(async () => {
      const result = await updateLeadFields(lead.id, { status });
      if (result.error) toast.error(result.error);
      else toast.success("Status updated");
    });
  };

  const handlePriorityChange = (priority: Enums<"lead_priority"> | null) => {
    if (!priority) return;
    startTransition(async () => {
      const result = await updateLeadFields(lead.id, { priority });
      if (result.error) toast.error(result.error);
      else toast.success("Priority updated");
    });
  };

  const handleSaveNextAction = () => {
    startTransition(async () => {
      const result = await updateLeadFields(lead.id, { next_action: nextAction });
      if (result.error) toast.error(result.error);
      else toast.success("Next action saved");
    });
  };

  const handleGenerateDraft = () => {
    startTransition(async () => {
      const result = await generateDraftReply(lead.id);
      if (result.error) toast.error(result.error);
      else {
        setDraftEmail(result.draftEmail ?? "");
        toast.success("Draft generated");
      }
    });
  };

  const handleSaveDraft = () => {
    startTransition(async () => {
      const result = await saveDraftReply(lead.id, draftEmail);
      if (result.error) toast.error(result.error);
      else toast.success("Draft saved");
    });
  };

  const handleSendReply = () => {
    startTransition(async () => {
      // Save whatever's currently in the textarea first, so edits aren't lost
      // if the admin tweaked the draft without clicking "Save draft".
      await saveDraftReply(lead.id, draftEmail);
      const result = await sendLeadReply(lead.id);
      if (result.error) toast.error(result.error);
      else toast.success("Reply sent");
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto data-[side=right]:sm:max-w-3xl">
        <SheetHeader className="border-b">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-primary/10 text-primary">
                {initialsOf(lead.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <SheetTitle>{lead.full_name}</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1">
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
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <div>
            <Label className="text-xs text-muted-foreground">Message</Label>
            <p className="mt-1.5 whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm">
              {lead.message || "—"}
            </p>
          </div>

          {lead.ai_summary && (
            <div>
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                AI summary
              </Label>
              <p className="mt-1.5 text-sm">{lead.ai_summary}</p>
              {lead.score !== null && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Lead score: <span className="font-medium tabular-nums">{lead.score}</span>/100
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Priority</Label>
              <Select
                value={lead.priority ?? undefined}
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
              <Select
                value={lead.status}
                onValueChange={handleStatusChange}
                disabled={isPending}
              >
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
            <Label htmlFor="next-action" className="text-xs text-muted-foreground">
              Next action
            </Label>
            <Textarea
              id="next-action"
              className="mt-1.5"
              rows={2}
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
            />
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              disabled={isPending}
              onClick={handleSaveNextAction}
            >
              Save next action
            </Button>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="draft-email" className="text-xs text-muted-foreground">
                Draft reply email
              </Label>
              <Button
                size="xs"
                variant="ghost"
                disabled={isPending}
                onClick={handleGenerateDraft}
                className="text-primary"
              >
                <Wand2 data-icon="inline-start" />
                {draftEmail ? "Regenerate with AI" : "Generate with AI"}
              </Button>
            </div>
            <Textarea
              id="draft-email"
              className="mt-1.5"
              rows={8}
              placeholder="No draft yet — generate one with AI, or write your own."
              value={draftEmail}
              onChange={(e) => setDraftEmail(e.target.value)}
            />
          </div>
        </div>

        <SheetFooter className="flex-row justify-between gap-2 border-t">
          <DeleteLeadDialog
            leadId={lead.id}
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
              disabled={isPending || !draftEmail || lead.status === "closed"}
              onClick={handleSendReply}
            >
              <Send data-icon="inline-start" />
              Send reply
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
