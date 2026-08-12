"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Scanner-safe magic link verification page.
// Email security bots (Gmail, Proofpoint, etc.) pre-fetch links via plain HTTP
// GET — consuming one-time tokens before the user clicks. By landing here first,
// the token is only consumed when real JavaScript executes in a browser.
//
// The email contains: /magic-link?token=<token>&callbackURL=<path>
// On load, we reconstruct the better-auth verify URL and navigate to it.
function MagicLinkVerifier() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "error">("verifying");

  useEffect(() => {
    const token = searchParams.get("token");
    const callbackURL = searchParams.get("callbackURL") || "/projects";

    if (!token) {
      // Deferred so the state update doesn't run synchronously inside the effect.
      Promise.resolve().then(() => setStatus("error"));
      return;
    }

    // Rebuilt from individual params rather than carrying a full URL in the
    // query string — nested encoding breaks when link-tracking rewrites it.
    window.location.href =
      `/api/auth/magic-link/verify?token=${encodeURIComponent(token)}` +
      `&callbackURL=${encodeURIComponent(callbackURL)}`;
  }, [searchParams]);

  if (status === "error") {
    return (
      <div className="w-full max-w-sm text-center space-y-4">
        <XCircle className="mx-auto size-10 text-destructive" />
        <h1 className="text-xl font-semibold">Invalid sign-in link</h1>
        <p className="text-sm text-muted-foreground">
          This link is missing its token. Request a new one from the sign-in page.
        </p>
        <Button asChild className="w-full cursor-pointer">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Loader2 className="mx-auto size-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </>
  );
}

export function MagicLinkClient() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-4">
        <Image src="/logo.png" alt="ScopeGate" width={48} height={48} className="mx-auto" />
        <Suspense
          fallback={
            <>
              <Loader2 className="mx-auto size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Signing you in…</p>
            </>
          }
        >
          <MagicLinkVerifier />
        </Suspense>
      </div>
    </div>
  );
}
