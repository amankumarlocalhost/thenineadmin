"use client";

import { createContext, useContext, useEffect, useState } from "react";

const PageTitleContext = createContext(null);

export function PageTitleProvider({ children }) {
  const [title, setTitle] = useState("Dashboard");
  return <PageTitleContext.Provider value={{ title, setTitle }}>{children}</PageTitleContext.Provider>;
}

// Call at the top of any page: usePageTitle("Orders") — sets the shell
// topbar's heading without prop-drilling through the layout tree.
export function usePageTitle(title) {
  const ctx = useContext(PageTitleContext);
  useEffect(() => {
    if (ctx) ctx.setTitle(title);
  }, [ctx, title]);
}

export function useCurrentPageTitle() {
  const ctx = useContext(PageTitleContext);
  if (!ctx) throw new Error("useCurrentPageTitle must be used within PageTitleProvider");
  return ctx.title;
}
