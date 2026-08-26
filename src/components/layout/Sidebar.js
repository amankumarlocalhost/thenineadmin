"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS } from "./navConfig";

function isActive(pathname, href) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ open, onClose }) {
  const pathname = usePathname();

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={onClose} />}
      <aside
        // shrink-0 keeps the 64-wide column from being squeezed by a wide
        // table, and overscroll-contain stops a flick at the end of the nav
        // from carrying through to the content area behind it.
        className={`admin-scroll fixed inset-y-0 left-0 z-40 w-64 shrink-0 overflow-y-auto overscroll-contain bg-sidebar-bg transition-transform duration-200 lg:static lg:h-full lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="sticky top-0 border-b border-white/10 bg-sidebar-bg px-6 py-6">
          <p className="font-serif text-xl italic text-sidebar-ink">THE NINE</p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-sidebar-muted">Operations</p>
        </div>

        <nav className="px-3 py-4">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className="mb-5">
              {group.label && (
                <p className="px-3 pb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-sidebar-muted">
                  {group.label}
                </p>
              )}
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 font-body text-sm transition-colors ${
                          active ? "bg-sidebar-active text-white" : "text-sidebar-ink/80 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className="w-4 text-center text-[13px] opacity-80" aria-hidden="true">
                          {item.icon}
                        </span>
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
