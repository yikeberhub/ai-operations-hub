import { ChatPanel } from "@/components/support-agent/chat-panel";

export default function SupportAgentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Platform Assistant</h1>
        <p className="text-muted-foreground">
          Ask questions about your organization&apos;s knowledge base — policies, docs, FAQs, anything
          you&apos;ve added under Settings. Answers cite the exact source excerpts and a confidence
          score; this isn&apos;t a general-purpose AI, it only knows what&apos;s in your knowledge base.
          Low-confidence answers are flagged for a human.
        </p>
      </div>

      <ChatPanel />
    </div>
  );
}
