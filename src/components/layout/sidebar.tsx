"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useProject } from "@/components/project/project-context";

export function Sidebar() {
  const pathname = usePathname();
  const { project } = useProject();

  return (
    <aside className="flex w-64 flex-col border-r bg-muted/30">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/projects" className="flex items-center gap-2 text-lg font-semibold">
          <Image src="/logo.png" alt="ScopeGate" width={28} height={28} />
          ScopeGate
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        <Link
          href="/projects"
          className={cn(
            "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/projects"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          Projects
        </Link>

        {project && (
          <>
            <div className="px-3 pt-4 pb-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {project.projectName}
              </p>
            </div>
            {[
              { label: "Endpoints", tab: "endpoints" },
              { label: "Connections", tab: "services" },
              { label: "Logs", tab: "logs" },
            ].map((item) => {
              const href = `/projects/${project.projectId}?tab=${item.tab}`;
              const isActive =
                pathname === `/projects/${project.projectId}` &&
                (new URLSearchParams(
                  typeof window !== "undefined"
                    ? window.location.search
                    : ""
                ).get("tab") || "endpoints") === item.tab;

              return (
                <Link
                  key={item.tab}
                  href={href}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ml-2",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href={`/projects/${project.projectId}/settings`}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ml-2",
                pathname === `/projects/${project.projectId}/settings`
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              Settings
            </Link>
          </>
        )}

        <Link
          href="/settings"
          className={cn(
            "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/settings"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          Settings
        </Link>

        <Link
          href="/admin/users"
          className={cn(
            "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith("/admin")
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          Admin
        </Link>
      </nav>
    </aside>
  );
}
