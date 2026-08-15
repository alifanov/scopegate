import Image from "next/image";
import Link from "next/link";
import { isCloud } from "@/lib/cloud";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const cloud = isCloud();
  const googleEnabled = cloud && Boolean(process.env.GOOGLE_SIGNIN_CLIENT_ID);
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block cursor-pointer">
            <Image src="/logo.png" alt="ScopeGate" width={64} height={64} className="mx-auto" />
            <h1 className="text-3xl font-bold tracking-tight">ScopeGate</h1>
          </Link>
          <p className="text-muted-foreground">
            AI Access Proxy Layer. Connect services, define granular permissions,
            and expose MCP endpoints for your AI agents.
          </p>
        </div>
        <LoginForm
          cloud={cloud}
          googleEnabled={googleEnabled}
          magicLinkError={Boolean(error)}
        />
      </div>
    </div>
  );
}
