/* AM2050 — Field Ledger Modernism: list endpoints explicitly carry page, limit, search, and scoped field parameters. */
import { apiClient, ApiEnvelope } from "@/api/client";

export type HouseholdPayload = { headName: string; guardianPhone: string; communityId: number; wardId: number; latitude?: number; longitude?: number; tempId?: string };
export type HouseholdListItem = { id: number; householdCode: string; headName: string; guardianPhone: string; communityName: string; wardName: string; status: string };

export function listHouseholds(query: { page: number; limit: number; search?: string; wardId?: number }) {
  const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit), ...(query.search ? { search: query.search } : {}), ...(query.wardId ? { ward_id: String(query.wardId) } : {}) });
  return apiClient.request<HouseholdListItem[]>(`/households?${params.toString()}`);
}

export function createHousehold(payload: HouseholdPayload): Promise<ApiEnvelope<HouseholdListItem>> { return apiClient.request("/households", { method: "POST", body: payload }); }
