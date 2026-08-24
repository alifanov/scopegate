import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-middleware";
import { AUTH_VIEWPORT } from "@/lib/marketing-viewport";

// login/signup/invite are auth flows, not content — keep them crawlable
// (no robots.txt disallow, or noindex would never be read) but out of the
// index; none of them export their own metadata, so this is inherited
// as-is (Task #280).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const viewport = AUTH_VIEWPORT;

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/projects");
  }
  // dark: bridges the dark marketing landing into the login/signup/invite
  // forms — dashboard itself stays light (Task #246).
  return <div className="dark min-h-screen bg-background text-foreground">{children}</div>;
}
