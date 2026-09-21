/* AM2050 — Field Ledger Modernism: the API layer keeps tokens in memory and reports deployment configuration clearly. */
export type ApiEnvelope<T> = { success: true; data: T; pagination?: { page: number; limit: number; total: number; totalPages: number } } | { success: false; error: string };

type RequestOptions = Omit<RequestInit, "body" | "headers"> & { body?: unknown; headers?: Record<string, string> };

class ApiClient {
  private accessToken: string | null = null;
  private baseUrl = (import.meta.env.VITE_AM2050_API_URL as string | undefined)?.replace(/\/+$/, "") || "/api/v1";

  setAccessToken(token: string | null) { this.accessToken = token; }
  getAccessToken() { return this.accessToken; }

  async request<T>(path: string, options: RequestOptions = {}, retried = false): Promise<ApiEnvelope<T>> {

    const usesFormAuth = path === "/auth/login" && options.body !== undefined;
    const usesBareRefresh = path === "/auth/refresh" && options.body === undefined;
    const body = usesFormAuth
      ? new URLSearchParams(Object.entries(options.body as Record<string, string>).map(([key, value]) => [key, String(value)])).toString()
      : options.body === undefined ? undefined : JSON.stringify(options.body);
    const headers = {
      ...(usesFormAuth ? { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" } : options.body === undefined || usesBareRefresh ? {} : { "Content-Type": "application/json" }),
      ...(!usesFormAuth && !usesBareRefresh && this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
      ...options.headers,
    };

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        credentials: "include",
        headers,
        body,
      });
      if (response.status === 401 && !retried && !path.startsWith("/auth/login") && !path.startsWith("/auth/refresh")) {
        const refreshed = await this.refresh();
        if (refreshed.success) {
          this.setAccessToken(refreshed.data.accessToken);
          return this.request<T>(path, options, true);
        }
        this.setAccessToken(null);
      }
      const payload = await response.json().catch(() => ({ success: false, error: "Unexpected response from AM2050 API." }));
      if (!response.ok || payload.success === false) return { success: false, error: payload.error ?? "Request could not be completed." };
      return payload as ApiEnvelope<T>;
    } catch {
      return { success: false, error: "Unable to reach the AM2050 secure API. Check the connection and try again." };
    }
  }

  async refresh() { return this.request<{ accessToken: string; user: unknown }>("/auth/refresh", { method: "POST" }); }

  async download(path: string): Promise<{ success: true; blob: Blob } | { success: false; error: string }> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, { credentials: "include", headers: this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {} });
      if (!response.ok) return { success: false, error: "The requested report could not be generated." };
      return { success: true, blob: await response.blob() };
    } catch { return { success: false, error: "Unable to reach the AM2050 secure API for this report." }; }
  }
}

export const apiClient = new ApiClient();
