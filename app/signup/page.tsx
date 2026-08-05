import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <AuthShell title="Create your account" subtitle="Get started with Muya Tech">
      <SignupForm />
    </AuthShell>
  );
}
