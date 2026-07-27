import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";

export function Topbar({ userEmail }: { userEmail?: string | null }) {
  const initials = userEmail?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <header className="flex h-14 items-center justify-end gap-3 border-b px-4">
      <ThemeToggle />
      <Avatar className="size-8">
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="icon" title="Sign out">
          <LogOut className="size-4" />
        </Button>
      </form>
    </header>
  );
}
