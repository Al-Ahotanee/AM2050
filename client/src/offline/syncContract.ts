/* AM2050 — Field Ledger Modernism: the frontend batches explicit operations, caps payloads at 500, and never silently discards a conflict. */
import { SyncOperation } from "@/lib/fieldStore";

export const MAX_SYNC_BATCH_SIZE = 500;
export type SyncBatchRequest = { records: Array<{ operation: "create" | "update"; entity: "household" | "child"; tempId: string; payload: unknown; syncedAt: string }> };
export type SyncRecordOutcome = { tempId: string; status: "synced" | "already_synced" | "conflict" | "error"; serverId?: string; code?: string; message?: string };
export type SyncBatchResponse = { records: SyncRecordOutcome[] };

export function createSyncBatches(queue: SyncOperation[]): SyncBatchRequest[] {
  const batches: SyncBatchRequest[] = [];
  for (let offset = 0; offset < queue.length; offset += MAX_SYNC_BATCH_SIZE) {
    const records = queue.slice(offset, offset + MAX_SYNC_BATCH_SIZE).map((item) => ({ operation: item.action, entity: item.entity, tempId: item.tempId, payload: item.payload, syncedAt: item.createdAt }));
    batches.push({ records });
  }
  return batches;
}

export function assertValidSyncBatch(batch: SyncBatchRequest) {
  if (batch.records.length > MAX_SYNC_BATCH_SIZE) throw new Error(`AM2050 sync batches cannot exceed ${MAX_SYNC_BATCH_SIZE} records.`);
  if (batch.records.some((record) => !record.tempId || !record.entity || !record.operation)) throw new Error("Every sync record needs entity, operation, and client-generated tempId.");
  return batch;
}
