"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useProject } from "@/components/project/project-context";
import { useSidebar } from "@/components/layout/sidebar-context";
import {
  FolderKanban,
  Waypoints,
  Plug,
  ScrollText,
  Settings,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { project } = useProject();
  const { open, setOpen, collapsed, setCollapsed } = useSidebar();

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
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-background transition-all duration-200 md:static md:translate-x-0",
          collapsed ? "w-14" : "w-64",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          {!collapsed && (
            <Link
              href="/projects"
              className="flex items-center gap-2 text-lg font-semibold"
              onClick={closeMobile}
            >
              <Image src="/logo.png" alt="ScopeGate" width={28} height={28} />
              ScopeGate
            </Link>
          )}
          {collapsed && (
            <Link
              href="/projects"
              className="flex items-center justify-center"
              onClick={closeMobile}
            >
              <Image src="/logo.png" alt="ScopeGate" width={28} height={28} />
            </Link>
          )}
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
            title="Projects"
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              collapsed && "justify-center px-0",
              pathname === "/projects"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <FolderKanban className="size-4 shrink-0" />
            {!collapsed && "Projects"}
          </Link>

          {project && (
            <>
              {!collapsed && (
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
              )}
              {collapsed && <div className="pt-3" />}
              {[
                { label: "Endpoints", tab: "endpoints", icon: Waypoints },
                { label: "Connections", tab: "services", icon: Plug },
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
                    title={item.label}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      !collapsed && "ml-2",
                      collapsed && "justify-center px-0",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    {!collapsed && item.label}
                  </Link>
                );
              })}
            </>
          )}

          <Link
            href="/settings"
            onClick={closeMobile}
            title="Settings"
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              collapsed && "justify-center px-0",
              pathname === "/settings"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Settings className="size-4 shrink-0" />
            {!collapsed && "Settings"}
          </Link>

        </nav>

        {/* Collapse toggle — desktop only */}
        <div className="hidden md:flex border-t p-2">
          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer w-full",
              collapsed && "justify-center px-0"
            )}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4 shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="size-4 shrink-0" />
                Collapse
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
