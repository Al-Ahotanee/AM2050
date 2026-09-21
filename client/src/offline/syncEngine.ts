/* AM2050 — Field Ledger Modernism: queue records remain local until every server outcome is explicit. */
import { apiClient } from "@/api/client";
import { createSyncBatches } from "@/offline/syncContract";
import { applySyncOutcomes, getSyncQueue } from "@/lib/fieldStore";

type Outcome = { tempId: string; status: "synced" | "already_synced" | "conflict" | "error"; serverId?: string; code?: string; message?: string };
export async function syncPendingRecords(): Promise<Outcome[]> {
  const queue = getSyncQueue(); const results: Outcome[] = [];
  for (const batch of createSyncBatches(queue)) { const response = await apiClient.request<{ records: Outcome[] }>("/sync/batch", { method: "POST", body: batch }); if (!response.success) throw new Error(response.error); results.push(...response.data.records); applySyncOutcomes(response.data.records); }
  return results;
}
