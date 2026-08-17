import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-middleware";
import { AUTH_VIEWPORT } from "@/lib/marketing-viewport";

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
