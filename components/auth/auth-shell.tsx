import { Bot, Sparkles } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary to-primary/60 p-10 text-primary-foreground lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.15),_transparent_60%)]" />
        <div className="relative flex items-center gap-2">
          <Bot className="size-6" />
          <span className="font-heading text-sm font-medium">AI Operations Hub</span>
        </div>
        <div className="relative space-y-4">
          <Sparkles className="size-8 opacity-90" />
          <p className="max-w-sm text-2xl font-semibold leading-snug">
            Inbound email and leads, triaged, scored, and answered — automatically.
          </p>
          <p className="max-w-sm text-sm text-primary-foreground/80">
            AI-powered categorization, priority scoring, sentiment analysis, and a knowledge-base
            support agent, all in one place.
          </p>
        </div>
        <p className="relative text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} AI Operations Hub
        </p>
      </div>

      <div className="flex w-full flex-col items-center justify-center bg-muted/30 px-4 py-12 lg:w-1/2">
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <Bot className="size-6 text-primary" />
          <span className="font-heading text-sm font-medium text-foreground">
            AI Operations Hub
          </span>
        </div>
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <h1 className="font-heading text-xl font-bold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
