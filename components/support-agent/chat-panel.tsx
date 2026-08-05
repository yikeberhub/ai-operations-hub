"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Bot, Loader2, Send, TriangleAlert, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { askSupportAgent } from "@/lib/actions/support-agent";

type Source = { documentId: string; content: string; similarity: number };

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  confidence?: number;
};

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const style =
    confidence >= 0.7
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : confidence >= 0.4
        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
        : "bg-rose-500/10 text-rose-600 dark:text-rose-400";
  return (
    <Badge variant="secondary" className={`border-0 ${style}`}>
      {pct}% confidence
    </Badge>
  );
}

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [escalated, setEscalated] = useState(false);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    const question = input.trim();
    if (!question || isPending) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");

    startTransition(async () => {
      const result = await askSupportAgent(sessionId, question);

      if (result.error || !result.message) {
        toast.error(result.error ?? "Something went wrong");
        return;
      }

      setSessionId(result.sessionId);
      if (result.escalated) setEscalated(true);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.message!.content,
          sources: (result.message!.sources as Source[] | null) ?? [],
          confidence: result.message!.confidence ?? undefined,
        },
      ]);

      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      });
    });
  };

  return (
    <Card className="flex h-[70vh] flex-col">
      {escalated && (
        <div className="flex items-center gap-2 border-b bg-amber-500/10 px-4 py-2 text-sm text-amber-700 dark:text-amber-400">
          <TriangleAlert className="size-4 shrink-0" />
          This conversation was flagged for a human agent — confidence was too low to answer reliably.
        </div>
      )}

      <CardContent ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto py-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <Bot className="size-8" />
            <p className="text-sm">
              Ask about this platform — features, policies, how things work. Answers come only
              from the knowledge base, not general AI knowledge.
            </p>
          </div>
        )}

        {messages.map((message, i) => (
          <div
            key={i}
            className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
              {message.role === "user" ? (
                <User className="size-4" />
              ) : (
                <Bot className="size-4 text-primary" />
              )}
            </div>
            <div className={`max-w-[80%] space-y-2 ${message.role === "user" ? "items-end" : ""}`}>
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {message.content}
              </div>
              {message.role === "assistant" && message.confidence !== undefined && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <ConfidenceBadge confidence={message.confidence} />
                  {message.sources?.map((source, si) => (
                    <Badge key={si} variant="outline" className="text-xs">
                      Source {si + 1} · {Math.round(source.similarity * 100)}%
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isPending && (
          <div className="flex gap-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
              <Bot className="size-4 text-primary" />
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Thinking…
            </div>
          </div>
        )}
      </CardContent>

      <div className="flex items-end gap-2 border-t p-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask about this platform…"
          rows={1}
          className="min-h-9 resize-none"
        />
        <Button size="icon" disabled={isPending || !input.trim()} onClick={handleSend}>
          <Send />
          <span className="sr-only">Send</span>
        </Button>
      </div>
    </Card>
  );
}
