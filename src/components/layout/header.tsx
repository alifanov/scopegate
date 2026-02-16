"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { useSidebar } from "@/components/layout/sidebar-context";

export function Header() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const { setOpen } = useSidebar();

  async function handleLogout() {
    await authClient.signOut();
    router.push("/login");
  }

  return (
    <header className="flex h-14 items-center justify-between border-b px-4 md:px-6">
      <button
        type="button"
        aria-label="Open sidebar"
        className="cursor-pointer rounded p-1 text-muted-foreground hover:text-foreground md:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </button>
      <div className="hidden md:block" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            {isPending ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              session?.user?.email || "Account"
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href="/settings">Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
