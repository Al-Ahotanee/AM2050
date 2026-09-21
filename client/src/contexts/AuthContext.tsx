/* AM2050 — Field Ledger Modernism: access tokens stay only in memory; refresh cookies restore an authenticated session. */
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { apiClient } from "@/api/client";
import { Role } from "@/lib/access";

export type AuthUser = { id: string; name: string; role: Role; phone: string; email: string | null; assigned_scope_type: string | null; assigned_scope_id: string | null };
type AuthContextValue = { user: AuthUser | null; ready: boolean; login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>; logout: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null); const [ready, setReady] = useState(false);
  useEffect(() => { apiClient.refresh().then((result) => { if (result.success) { apiClient.setAccessToken(result.data.accessToken); setUser(result.data.user as AuthUser); } }).finally(() => setReady(true)); }, []);
  const value = useMemo<AuthContextValue>(() => ({ user, ready, async login(phone, password) { const result = await apiClient.request<{ accessToken: string; user: AuthUser }>("/auth/login", { method: "POST", body: { phone, password } }); if (!result.success) return { success: false, error: result.error }; apiClient.setAccessToken(result.data.accessToken); setUser(result.data.user); return { success: true }; }, async logout() { await apiClient.request("/auth/logout", { method: "POST" }); apiClient.setAccessToken(null); setUser(null); } }), [user, ready]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error("useAuth must be used within AuthProvider"); return context; }
