import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isCloud } from "@/lib/cloud";
import { CloudSignIn } from "@/components/auth/cloud-sign-in";

export default function SignupPage() {
  // Self-hosted is invite-only by design — admins generate invite links from
  // the dashboard, so there is no public sign-up route there at all.
  if (!isCloud()) {
    notFound();
  }

  const googleEnabled = Boolean(process.env.GOOGLE_SIGNIN_CLIENT_ID);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Image src="/logo.png" alt="ScopeGate" width={64} height={64} className="mx-auto" />
          <h1 className="text-3xl font-bold tracking-tight">Start free</h1>
          <p className="text-muted-foreground">
            No credit card. One project and five MCP endpoints on the free plan.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription>
              Sign up with Google or get a one-time link by email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CloudSignIn googleEnabled={googleEnabled} />
          </CardContent>
          <CardFooter>
            <p className="w-full text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="cursor-pointer underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
