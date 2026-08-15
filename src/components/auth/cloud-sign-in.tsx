"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { Mail } from "lucide-react";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

/**
 * The two cloud sign-in methods that create a user on first use — Google and
 * magic link. Password sign-up stays disabled in every mode
 * (`disableSignUp: true` in auth.ts), so these are the only self-serve doors.
 */
export function CloudSignIn({
  googleEnabled,
  initialError,
}: {
  googleEnabled: boolean;
  initialError?: string;
}) {
  const [error, setError] = useState(initialError ?? "");
  const [sentTo, setSentTo] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGoogle() {
    setError("");
    setLoading(true);
    const { error: googleError } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/projects",
    });
    if (googleError) {
      setError(googleError.message || "Google sign-in failed");
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const email = new FormData(e.currentTarget).get("magic-email") as string;
    try {
      const { error: linkError } = await authClient.signIn.magicLink({
        email,
        callbackURL: "/projects",
      });
      if (linkError) {
        setError(linkError.message || "Could not send the sign-in link");
        return;
      }
      setSentTo(email);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (sentTo) {
    return (
      <div className="rounded-md border bg-muted/40 p-4 text-center text-sm">
        <Mail className="mx-auto mb-2 size-5 text-muted-foreground" />
        Check <span className="font-medium">{sentTo}</span> for your sign-in link.
        It expires in 5 minutes.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {googleEnabled && (
        <Button
          type="button"
          variant="outline"
          className="w-full cursor-pointer"
          onClick={handleGoogle}
          disabled={loading}
        >
          <GoogleIcon />
          Continue with Google
        </Button>
      )}

      <form onSubmit={handleMagicLink} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="magic-email">Email</Label>
          <Input
            id="magic-email"
            name="magic-email"
            type="email"
            placeholder="you@example.com"
            required
          />
        </div>
        <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
          <Mail className="size-4" />
          {loading ? "Sending…" : "Email me a sign-in link"}
        </Button>
      </form>
    </div>
  );
}
