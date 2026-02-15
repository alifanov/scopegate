import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">ScopeGate</h1>
        <p className="text-lg text-muted-foreground max-w-md">
          AI Access Proxy Layer. Connect services, define granular permissions,
          and expose MCP endpoints for your AI agents.
        </p>
      </div>
      <Button asChild>
        <Link href="/login">Sign In</Link>
      </Button>
    </div>
  );
}
