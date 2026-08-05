import { ChatPanel } from "@/components/support-agent/chat-panel";

export default function SupportAgentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Selam</h1>
        <p className="text-muted-foreground">
          Muya Tech&apos;s AI assistant, grounded in your organization&apos;s knowledge base — policies,
          docs, FAQs, anything added under Settings. Selam cites the exact source excerpts and a
          confidence score; she isn&apos;t a general-purpose AI, she only knows what&apos;s in your
          knowledge base. Low-confidence answers are flagged for a human.
        </p>
      </div>

      <ChatPanel />
    </div>
  );
}
