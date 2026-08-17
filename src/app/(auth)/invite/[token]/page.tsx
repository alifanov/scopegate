import Image from "next/image";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isInviteTokenValid } from "@/lib/accept-invite";
import { InviteForm } from "./invite-form";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const valid = await isInviteTokenValid(token);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Image
            src="/logo.png"
            alt="ScopeGate"
            width={64}
            height={64}
            className="mx-auto"
          />
          <h1 className="text-3xl font-bold tracking-tight">ScopeGate</h1>
          <p className="text-muted-foreground">
            {valid
              ? "You've been invited to join ScopeGate. Create your account below."
              : "This invite link is invalid or has already been used."}
          </p>
        </div>
        {valid ? (
          <InviteForm token={token} />
        ) : (
          <Card>
            <CardContent className="space-y-4 pt-6 text-center">
              <XCircle className="mx-auto size-10 text-destructive" />
              <p className="text-sm text-muted-foreground">
                Ask your admin for a new invite link, or sign in if you
                already have an account.
              </p>
              <Button asChild className="w-full cursor-pointer">
                <Link href="/login">Back to sign in</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
