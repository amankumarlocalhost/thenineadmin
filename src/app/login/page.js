"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ApiClientError } from "@/lib/api";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      const redirect = searchParams.get("redirect") || "/";
      router.push(redirect);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full">
      {/* Editorial backdrop — the storefront's own campaign imagery, so the
          console opens on the same brand world the shop does. */}
      <img
        src="/login-editorial.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-noir/85 via-noir/70 to-noir/85 lg:from-noir/95 lg:via-noir/55 lg:to-transparent" />

      <div className="relative grid min-h-screen lg:grid-cols-2">
        {/* Brand panel — desktop only */}
        <div className="hidden flex-col justify-between p-12 lg:flex xl:p-16">
          <p className="font-serif text-2xl italic text-ivory">THE NINE</p>
          <div>
            <div className="h-px w-14 bg-gold/70" />
            <h2 className="mt-6 max-w-md font-serif text-3xl leading-snug text-ivory">
              Everything behind the storefront, in one console.
            </h2>
            <p className="mt-4 max-w-sm font-body text-sm text-ivory/60">
              Orders, inventory, customers and the drop calendar — managed by the team, for the team.
            </p>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ivory/45">
            The Ninth Drop · Operations
          </p>
        </div>

        {/* Sign-in panel */}
        <div className="flex items-center justify-center px-4 py-12 lg:bg-paper">
          <div className="w-full max-w-sm">
            <div className="mb-8 text-center lg:hidden">
              <p className="font-serif text-3xl italic text-ivory">THE NINE</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-ivory/55">
                Operations Console
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-line-paper bg-surface p-7 shadow-2xl lg:shadow-xl"
            >
              <h1 className="font-serif text-xl text-ink">Sign in</h1>
              <p className="mt-1 font-body text-sm text-ink/55">Staff accounts only.</p>

              <label className="mt-6 block">
                <span className="font-body text-xs font-medium text-ink/70">Email</span>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-line-paper bg-surface px-3.5 py-2.5 font-body text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-stitch"
                />
              </label>

              <label className="mt-4 block">
                <span className="font-body text-xs font-medium text-ink/70">Password</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-line-paper bg-surface px-3.5 py-2.5 font-body text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-stitch"
                />
              </label>

              {error && (
                <p role="alert" className="mt-4 rounded-lg bg-danger-bg px-3 py-2 font-body text-xs text-danger">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-stitch py-3 font-body text-xs font-semibold uppercase tracking-[0.12em] text-paper transition-colors hover:bg-ink disabled:opacity-70"
              >
                {submitting && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-paper/40 border-t-paper" />}
                {submitting ? "Signing in…" : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
