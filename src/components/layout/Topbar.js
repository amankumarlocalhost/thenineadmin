"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS } from "@/lib/constants";

export function Topbar({ title, onMenuClick }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-line-paper bg-surface/90 px-5 py-3.5 backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Toggle navigation"
          className="rounded-lg p-1.5 text-ink/60 hover:bg-black/5 lg:hidden"
        >
          ☰
        </button>
        <h1 className="font-serif text-lg text-ink">{title}</h1>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2.5 rounded-full border border-line-paper py-1.5 pl-1.5 pr-3.5 hover:border-stitch"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stitch font-mono text-[11px] font-semibold text-paper">
            {user?.name?.[0]?.toUpperCase() || "A"}
          </span>
          <span className="font-body text-sm text-ink">{user?.name}</span>
        </button>

        {menuOpen && (
          <div className="animate-slide-up absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-line-paper bg-surface p-1.5 shadow-lg">
            <div className="px-3 py-2">
              <p className="font-body text-sm text-ink">{user?.name}</p>
              <p className="font-body text-xs text-ink/45">{user?.email}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-stitch">{ROLE_LABELS[user?.role] || user?.role}</p>
            </div>
            <div className="my-1 h-px bg-line-paper" />
            <button
              type="button"
              onClick={logout}
              className="w-full rounded-lg px-3 py-2 text-left font-body text-sm text-ink hover:bg-danger-bg hover:text-danger"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
