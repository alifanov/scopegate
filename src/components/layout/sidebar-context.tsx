"use client";

import { createContext, useContext, useState } from "react";

const SIDEBAR_COLLAPSED_KEY = "sidebar:collapsed";

interface SidebarContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  open: false,
  setOpen: () => {},
  collapsed: false,
  setCollapsed: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  });

  function handleSetCollapsed(value: boolean) {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(value));
    setCollapsed(value);
  }

  return (
    <SidebarContext.Provider value={{ open, setOpen, collapsed, setCollapsed: handleSetCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
