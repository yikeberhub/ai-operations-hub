import { ThemeToggle } from "@/components/theme-toggle";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

export function Topbar({ userEmail }: { userEmail?: string | null }) {
  const initials = userEmail?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <header className="flex h-14 items-center justify-end gap-3 border-b px-4">
      <ThemeToggle />
      <Avatar className="size-8">
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
    </header>
  );
}
