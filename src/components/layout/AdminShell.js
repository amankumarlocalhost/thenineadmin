"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAuth } from "@/context/AuthContext";
import { useCurrentPageTitle } from "@/context/PageTitleContext";

export function AdminShell({ children }) {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const title = useCurrentPageTitle();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-sunken">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-stitch/30 border-t-stitch" />
      </div>
    );
  }

  if (!user) return null; // AuthProvider is already redirecting to /login

  return (
    // Pinned to the viewport and never scrolled itself, so the sidebar and the
    // content each scroll inside their own column. Under `min-h-screen` the
    // whole page grew instead, and a long page dragged the nav off the top of
    // the screen along with it.
    <div className="flex h-dvh overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar title={title} onMenuClick={() => setSidebarOpen((o) => !o)} />
        <main className="admin-scroll flex-1 overflow-y-auto p-5 lg:p-7">
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
