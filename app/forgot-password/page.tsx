import Link from "next/link";
import { Mail, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/auth-shell";
import { requestPasswordReset } from "@/lib/actions/auth";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { success } = await searchParams;

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link"
    >
      {success ? (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-emerald-500/10 p-6 text-center">
          <MailCheck className="size-8 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm">
            If an account exists for that email, a reset link is on its way. Check your inbox.
          </p>
        </div>
      ) : (
        <form action={requestPasswordReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="pl-8"
              />
            </div>
          </div>
          <Button type="submit" className="w-full">
            Send reset link
          </Button>
        </form>
      )}
      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link href="/login" className="underline underline-offset-4">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
