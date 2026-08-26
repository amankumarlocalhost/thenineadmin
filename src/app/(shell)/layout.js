"use client";

import { PageTitleProvider } from "@/context/PageTitleContext";
import { AdminShell } from "@/components/layout/AdminShell";

export default function ShellLayout({ children }) {
  return (
    <PageTitleProvider>
      <AdminShell>{children}</AdminShell>
    </PageTitleProvider>
  );
}
