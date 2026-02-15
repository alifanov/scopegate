"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function Header() {
  const router = useRouter();

  async function handleLogout() {
    await authClient.signOut();
    router.push("/login");
  }

  return (
    <header className="flex h-14 items-center justify-between border-b px-6">
      <div />
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        Sign out
      </Button>
    </header>
  );
}
