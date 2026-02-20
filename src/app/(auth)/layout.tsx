import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-middleware";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/projects");
  }
  return <>{children}</>;
}
