import { ChatPanel } from "@/components/support-agent/chat-panel";

export default function ClientSupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ask AI</h1>
        <p className="text-muted-foreground">
          Get an instant answer grounded in our knowledge base. If we&apos;re not confident, a
          real person will follow up.
        </p>
      </div>

      <ChatPanel />
    </div>
  );
}
