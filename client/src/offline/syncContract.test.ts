/* AM2050 — Field Ledger Modernism: assert the fixed 500-record sync cap and idempotency metadata requirements. */
import { describe, expect, it } from "vitest";
import { assertValidSyncBatch, createSyncBatches, MAX_SYNC_BATCH_SIZE } from "@/offline/syncContract";
import type { SyncOperation } from "@/lib/fieldStore";

function operation(index: number): SyncOperation {
  return { id: `queue-${index}`, entity: index % 2 ? "child" : "household", action: "create", tempId: `temp-${index}`, payload: { localId: `record-${index}` } as never, createdAt: "2026-08-20T08:00:00.000Z" };
}

describe("AM2050 offline sync contract", () => {
  it("splits queued writes at the required 500-record batch limit", () => {
    const batches = createSyncBatches(Array.from({ length: MAX_SYNC_BATCH_SIZE + 1 }, (_, index) => operation(index)));
    expect(batches).toHaveLength(2);
    expect(batches[0].records).toHaveLength(MAX_SYNC_BATCH_SIZE);
    expect(batches[1].records).toHaveLength(1);
  });

  it("requires a client-generated temporary ID for every queued record", () => {
    expect(() => assertValidSyncBatch({ records: [{ operation: "create", entity: "child", tempId: "", payload: {}, syncedAt: "2026-08-20T08:00:00.000Z" }] })).toThrow("tempId");
  });
});
