import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitLead } from "@/lib/actions/leads";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="items-center text-center">
          <Bot className="mb-2 size-8 text-primary" />
          <CardTitle>Get in touch</CardTitle>
          <p className="text-sm text-muted-foreground">
            Send us a message and our team will get back to you.
          </p>
        </CardHeader>
        <CardContent>
          {success ? (
            <p className="text-center text-sm text-muted-foreground">
              Thanks — your message has been sent. We&apos;ll be in touch soon.
            </p>
          ) : (
            <form action={submitLead} className="space-y-4">
              <input type="hidden" name="redirectTo" value="/contact" />
              <div className="space-y-2">
                <Label htmlFor="fullName">Name</Label>
                <Input id="fullName" name="fullName" type="text" required autoComplete="name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required autoComplete="email" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company (optional)</Label>
                  <Input id="company" name="company" type="text" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input id="phone" name="phone" type="tel" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" name="message" required rows={5} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full">
                Send message
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
