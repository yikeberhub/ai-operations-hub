import { ChatPanel } from "@/components/support-agent/chat-panel";

export default function SupportAgentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Support Agent</h1>
        <p className="text-muted-foreground">
          Ask a question and get an answer grounded in the knowledge base, with citations and a
          confidence score. Low-confidence answers are flagged for a human.
        </p>
      </div>

      <ChatPanel />
    </div>
  );
}
