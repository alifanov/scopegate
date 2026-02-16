import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProjectProvider } from "@/components/project/project-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProjectProvider>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </ProjectProvider>
  );
}
