import { ChatPanel } from "@/components/support-agent/chat-panel";

export default function ClientSupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Chat with Selam</h1>
        <p className="text-muted-foreground">
          Selam is Muya Tech&apos;s AI assistant — get instant answers about our services, policies,
          and how things work, sourced directly from our knowledge base, not a generic AI. If
          she&apos;s not confident in an answer, a real person will follow up.
        </p>
      </div>

      <ChatPanel />
    </div>
  );
}
