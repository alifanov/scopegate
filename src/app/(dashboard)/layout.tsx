import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProjectProvider } from "@/components/project/project-context";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { getCurrentUser } from "@/lib/auth-middleware";
import { isAdmin } from "@/lib/admin";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const adminAccess = user ? isAdmin(user.email) : false;

  return (
    <ProjectProvider>
      <SidebarProvider>
        <div className="flex h-screen">
          <Suspense>
            <Sidebar isAdmin={adminAccess} />
          </Suspense>
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </ProjectProvider>
  );
}
