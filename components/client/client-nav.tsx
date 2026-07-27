"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquareText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/client", label: "My messages", icon: MessageSquareText },
  { href: "/client/support", label: "Ask AI", icon: Sparkles },
];

export function ClientNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 border-b px-6 py-2">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
