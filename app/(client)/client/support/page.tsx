import { ChatPanel } from "@/components/support-agent/chat-panel";

export default function ClientSupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ask about your account</h1>
        <p className="text-muted-foreground">
          Get instant answers about our services, policies, and how things work — sourced directly
          from our team&apos;s knowledge base, not a generic AI. If we&apos;re not confident in an
          answer, a real person will follow up.
        </p>
      </div>

      <ChatPanel />
    </div>
  );
}
