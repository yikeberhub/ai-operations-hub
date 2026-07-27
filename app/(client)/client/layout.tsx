import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { Topbar } from "@/components/dashboard/topbar";
import { ClientNav } from "@/components/client/client-nav";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getCurrentProfile();

  if (!user) redirect("/login");
  if (profile?.role === "admin" || profile?.role === "agent") redirect("/dashboard");

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      <Topbar userEmail={user.email} />
      <ClientNav />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
