/* AM2050 — Field Ledger Modernism: the server owns sequential child IDs; the client sends a temporary ID only for idempotent sync. */
import { apiClient, ApiEnvelope } from "@/api/client";

export type ChildPayload = { firstName: string; middleName?: string; surname: string; dateOfBirth: string; gender: string; householdId: number; guardianName: string; guardianPhone: string; communityId: number; disabilityStatus?: string; isAlmajiri: boolean; latitude?: number; longitude?: number; tempId?: string };
export type ChildListItem = { id: number; childUniqueId: string; firstName: string; middleName?: string; surname: string; householdId: number; enrollmentStatus: string; createdAt: string };

export function listChildren(query: { page: number; limit: number; search?: string; wardId?: number }) {
  const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit), ...(query.search ? { search: query.search } : {}), ...(query.wardId ? { ward_id: String(query.wardId) } : {}) });
  return apiClient.request<ChildListItem[]>(`/children?${params.toString()}`);
}

export function createChild(payload: ChildPayload): Promise<ApiEnvelope<ChildListItem>> { return apiClient.request("/children", { method: "POST", body: payload }); }
