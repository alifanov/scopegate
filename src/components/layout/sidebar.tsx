"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useProject } from "@/components/project/project-context";
import { useSidebar } from "@/components/layout/sidebar-context";
import {
  FolderKanban,
  Globe,
  ScrollText,
  Settings,
  X,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { project } = useProject();
  const { open, setOpen } = useSidebar();

  const currentTab = searchParams.get("tab") || "endpoints";

  function closeMobile() {
    setOpen(false);
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background transition-transform duration-200 md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Link
            href="/projects"
            className="flex items-center gap-2 text-lg font-semibold"
            onClick={closeMobile}
          >
            <Image src="/logo.png" alt="ScopeGate" width={28} height={28} />
            ScopeGate
          </Link>
          <button
            type="button"
            aria-label="Close sidebar"
            className="cursor-pointer rounded p-1 text-muted-foreground hover:text-foreground md:hidden"
            onClick={closeMobile}
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          <Link
            href="/projects"
            onClick={closeMobile}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/projects"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <FolderKanban className="size-4" />
            Projects
          </Link>

          {project && (
            <>
              <div className="flex items-center justify-between px-3 pt-4 pb-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  {project.projectName}
                </p>
                <Link
                  href={`/projects/${project.projectId}/settings`}
                  onClick={closeMobile}
                  className={cn(
                    "rounded p-0.5 transition-colors",
                    pathname === `/projects/${project.projectId}/settings`
                      ? "text-accent-foreground"
                      : "text-muted-foreground hover:text-accent-foreground"
                  )}
                  title="Project settings"
                >
                  <Settings className="size-3.5" />
                </Link>
              </div>
              {[
                { label: "Endpoints", tab: "endpoints", icon: Globe },
                { label: "Connections", tab: "services", icon: Globe },
                { label: "Logs", tab: "logs", icon: ScrollText },
              ].map((item) => {
                const href = `/projects/${project.projectId}?tab=${item.tab}`;
                const isActive =
                  pathname === `/projects/${project.projectId}` &&
                  currentTab === item.tab;

                return (
                  <Link
                    key={item.tab}
                    href={href}
                    onClick={closeMobile}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ml-2",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}

          <Link
            href="/settings"
            onClick={closeMobile}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/settings"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Settings className="size-4" />
            Settings
          </Link>

        </nav>
      </aside>
    </>
  );
}
