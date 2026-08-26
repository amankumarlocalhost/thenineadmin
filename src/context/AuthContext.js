"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api, ApiClientError } from "@/lib/api";
import { STAFF_ROLES } from "@/lib/constants";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const revalidate = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      const u = res.data.user;
      if (!STAFF_ROLES.includes(u.role)) {
        setUser(null);
        return null;
      }
      setUser(u);
      return u;
    } catch (err) {
      if (!(err instanceof ApiClientError)) throw err;
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Deferred a tick so the session check lands as an update rather than a
    // synchronous setState-in-effect (React Compiler lint).
    queueMicrotask(() => revalidate());
  }, [revalidate]);

  useEffect(() => {
    if (loading) return;
    const isLoginPage = pathname === "/login";
    if (!user && !isLoginPage) router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    if (user && isLoginPage) router.replace("/");
  }, [user, loading, pathname, router]);

  const login = useCallback(
    async (email, password) => {
      const res = await api.post("/auth/admin/login", { email, password });
      setUser(res.data.user);
      return res.data.user;
    },
    []
  );

  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = useMemo(() => ({ user, loading, login, logout, revalidate }), [user, loading, login, logout, revalidate]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
