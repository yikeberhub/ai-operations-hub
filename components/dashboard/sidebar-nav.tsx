"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Mail,
  MessageSquareText,
  ScrollText,
  Settings,
  Bot,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/email-intelligence", label: "Email Intelligence", icon: Mail },
  { href: "/support-agent", label: "Support Agent", icon: MessageSquareText },
  { href: "/workflow-logs", label: "Workflow Logs", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: Settings },
];

const STORAGE_KEY = "sidebar-collapsed";

export function SidebarNav() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    setHydrated(true);
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  };

  return (
    <nav
      className={cn(
        "flex h-full flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-16" : "w-60",
        !hydrated && "duration-0"
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Bot className="size-5 shrink-0 text-primary" />
        {!collapsed && <span className="truncate font-semibold">AI Operations Hub</span>}
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </div>
      <button
        type="button"
        onClick={toggle}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cn(
          "flex items-center gap-2 border-t px-3 py-2.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
          collapsed && "justify-center px-0"
        )}
      >
        {collapsed ? <ChevronsRight className="size-4 shrink-0" /> : <ChevronsLeft className="size-4 shrink-0" />}
        {!collapsed && <span>Collapse</span>}
      </button>
    </nav>
  );
}
