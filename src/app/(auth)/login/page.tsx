import Image from "next/image";
import { isCloud } from "@/lib/cloud";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  const cloud = isCloud();
  const googleEnabled = cloud && Boolean(process.env.GOOGLE_SIGNIN_CLIENT_ID);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Image src="/logo.png" alt="ScopeGate" width={64} height={64} className="mx-auto" />
          <h1 className="text-3xl font-bold tracking-tight">ScopeGate</h1>
          <p className="text-muted-foreground">
            AI Access Proxy Layer. Connect services, define granular permissions,
            and expose MCP endpoints for your AI agents.
          </p>
        </div>
        <LoginForm cloud={cloud} googleEnabled={googleEnabled} />
      </div>
    </div>
  );
}
