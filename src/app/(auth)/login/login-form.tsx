"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogIn } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { CloudSignIn } from "@/components/auth/cloud-sign-in";

export function LoginForm({
  cloud,
  googleEnabled,
  magicLinkError,
}: {
  cloud: boolean;
  googleEnabled: boolean;
  magicLinkError?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message || "Login failed");
        return;
      }

      router.push("/projects");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Sign In</CardTitle>
        <CardDescription>
          {cloud
            ? "Continue with Google, a one-time link, or your password"
            : "Enter your credentials to access ScopeGate"}
        </CardDescription>
      </CardHeader>

      {cloud && (
        <CardContent className="space-y-4">
          <CloudSignIn
            googleEnabled={googleEnabled}
            initialError={
              magicLinkError
                ? "This sign-in link is invalid or has expired. Request a new one below."
                : undefined
            }
          />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                or use a password
              </span>
            </div>
          </div>
        </CardContent>
      )}

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {cloud && (
            <p className="text-sm font-medium text-muted-foreground">
              Sign in with password
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-3 pt-2">
          <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
            <LogIn className="size-4" />
            {loading ? "Signing in..." : "Sign In"}
          </Button>
          {cloud && (
            <p className="text-center text-sm text-muted-foreground">
              No account?{" "}
              <Link href="/signup" className="cursor-pointer underline">
                Start free
              </Link>
            </p>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
