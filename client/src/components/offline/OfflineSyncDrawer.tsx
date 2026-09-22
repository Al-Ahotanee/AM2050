/* AM2050 — Field Ledger Modernism: Offline Sync Center drawer providing full transparency into queued drafts, network conditions, and manual sync execution. */
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CloudOff,
  Database,
  GraduationCap,
  Home,
  Loader2,
  RefreshCw,
  Signal,
  SignalLow,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getSyncQueue, SyncOperation, Household, Child } from "@/lib/fieldStore";
import { syncPendingRecords } from "@/offline/syncEngine";

type OfflineSyncDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  onQueueUpdated?: () => void;
};

type NetworkStatus = {
  online: boolean;
  effectiveType?: string;
  rtt?: number;
};

export function OfflineSyncDrawer({ isOpen, onClose, onQueueUpdated }: OfflineSyncDrawerProps) {
  const [queue, setQueue] = useState<SyncOperation[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string | null>(null);
  const [network, setNetwork] = useState<NetworkStatus>({
    online: typeof navigator !== "undefined" ? navigator.onLine : true,
  });
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("am2050_last_sync_time");
    }
    return null;
  });

  const refreshList = () => {
    setQueue(getSyncQueue());
  };

  useEffect(() => {
    if (!isOpen) return;
    refreshList();
  }, [isOpen]);

  // Monitor network connectivity & quality
  useEffect(() => {
    const updateNetwork = () => {
      const conn = (navigator as unknown as { connection?: { effectiveType?: string; rtt?: number } }).connection;
      setNetwork({
        online: navigator.onLine,
        effectiveType: conn?.effectiveType,
        rtt: conn?.rtt,
      });
    };

    updateNetwork();
    window.addEventListener("online", updateNetwork);
    window.addEventListener("offline", updateNetwork);

    const conn = (navigator as unknown as { connection?: EventTarget & { effectiveType?: string; rtt?: number } }).connection;
    if (conn && conn.addEventListener) {
      conn.addEventListener("change", updateNetwork);
    }

    return () => {
      window.removeEventListener("online", updateNetwork);
      window.removeEventListener("offline", updateNetwork);
      if (conn && conn.removeEventListener) {
        conn.removeEventListener("change", updateNetwork);
      }
    };
  }, []);

  const handleSyncNow = async () => {
    if (!network.online) {
      toast.error("Device is currently offline. Connect to cellular or Wi-Fi to sync.");
      return;
    }

    if (queue.length === 0) {
      toast.info("No pending records to sync.");
      return;
    }

    setSyncing(true);
    setSyncProgress(`Initiating batch upload for ${queue.length} record(s)...`);

    try {
      const outcomes = await syncPendingRecords();
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastSyncTime(now);
      if (typeof window !== "undefined") {
        localStorage.setItem("am2050_last_sync_time", now);
      }

      refreshList();
      if (onQueueUpdated) onQueueUpdated();

      const successCount = outcomes.filter((o) => o.status === "synced" || o.status === "already_synced").length;
      const errorCount = outcomes.length - successCount;

      if (errorCount === 0) {
        toast.success(`Successfully synchronized ${successCount} record(s) to cloud registry.`);
      } else {
        toast.warning(
          `Synced ${successCount} record(s); ${errorCount} had warnings or conflicts. Remaining items kept in queue.`
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync encountered a network error.";
      toast.error(message);
    } finally {
      setSyncing(false);
      setSyncProgress(null);
    }
  };

  if (!isOpen) return null;

  const householdCount = queue.filter((i) => i.entity === "household").length;
  const childCount = queue.filter((i) => i.entity === "child").length;
  const isWeakSignal =
    network.online &&
    (network.effectiveType === "2g" || network.effectiveType === "slow-2g" || (network.rtt && network.rtt > 800));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#082236]/45 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Panel */}
      <aside
        role="dialog"
        aria-label="Field Sync Center"
        aria-modal="true"
        className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-[#c7d2d6] bg-[#fcfbf8] shadow-2xl"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b-2 border-[#167a4c] bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-md bg-[#e7f4eb] text-[#167a4c]">
              <Database size={20} />
            </div>
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#167a4c]">
                Field Sync Center
              </p>
              <h2 className="font-display text-lg font-bold text-[#123148]">Offline Ledger Queue</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sync drawer"
            className="grid size-8 place-items-center rounded-md text-[#57707f] transition hover:bg-[#eff5f1] hover:text-[#123148]"
          >
            <X size={18} />
          </button>
        </header>

        {/* Network Connectivity Ribbon */}
        <div className="border-b border-[#cfd9d2] bg-[#f7faf7] px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {network.online ? (
                isWeakSignal ? (
                  <span className="flex items-center gap-1.5 rounded-full border border-[#ead3a3] bg-[#fbf2df] px-2.5 py-0.5 text-xs font-semibold text-[#815813]">
                    <SignalLow size={13} className="text-[#c88b25]" />
                    Weak Cellular (2G/3G)
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 rounded-full border border-[#b9dcc3] bg-[#e7f4eb] px-2.5 py-0.5 text-xs font-semibold text-[#0e5a38]">
                    <Wifi size={13} className="text-[#167a4c]" />
                    Online · High Speed
                  </span>
                )
              ) : (
                <span className="flex items-center gap-1.5 rounded-full border border-[#e8b5af] bg-[#fdf4f4] px-2.5 py-0.5 text-xs font-semibold text-[#ae3f32]">
                  <WifiOff size={13} className="text-[#ae3f32]" />
                  Offline · Field Ledger Active
                </span>
              )}
            </div>
            {lastSyncTime && (
              <span className="font-mono text-[10px] text-[#69808e]">
                Last synced: <span className="font-bold text-[#234c64]">{lastSyncTime}</span>
              </span>
            )}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#57707f]">
            {network.online
              ? "Your terminal has connectivity with AM2050 cloud infrastructure. Pending items can be pushed immediately."
              : "No connection detected. All captured household cases and child profiles are safely stored locally in your device's IndexedDB."}
          </p>
        </div>

        {/* Queue Stats Bar */}
        <div className="grid grid-cols-2 gap-2 border-b border-[#cfd9d2] bg-white px-5 py-3">
          <div className="rounded border border-[#d8e0da] bg-[#fafbfc] p-2.5">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-[#57707f]">
              <Home size={13} /> Household Drafts
            </span>
            <span className="mt-1 block font-mono text-xl font-bold text-[#123148]">{householdCount}</span>
          </div>
          <div className="rounded border border-[#d8e0da] bg-[#fafbfc] p-2.5">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-[#57707f]">
              <GraduationCap size={13} /> Child Profiles
            </span>
            <span className="mt-1 block font-mono text-xl font-bold text-[#123148]">{childCount}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="border-b border-[#cfd9d2] bg-white p-4">
          <button
            type="button"
            disabled={syncing || queue.length === 0 || !network.online}
            onClick={() => void handleSyncNow()}
            className={`action-press flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition ${
              syncing
                ? "cursor-wait bg-[#167a4c]/80 text-white"
                : queue.length === 0
                ? "cursor-not-allowed border border-[#d8e0da] bg-[#f4f6f4] text-[#869ba6]"
                : !network.online
                ? "cursor-not-allowed border border-[#ead3a3] bg-[#fbf2df] text-[#815813]"
                : "bg-[#167a4c] text-white hover:bg-[#0e5a38]"
            }`}
          >
            {syncing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{syncProgress || "Syncing records..."}</span>
              </>
            ) : queue.length === 0 ? (
              <>
                <CheckCircle2 size={16} className="text-[#167a4c]" />
                <span>All Records Synchronized</span>
              </>
            ) : !network.online ? (
              <>
                <CloudOff size={16} />
                <span>Offline — Connect to Sync</span>
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                <span>Sync Now ({queue.length} pending)</span>
              </>
            )}
          </button>
        </div>

        {/* Queue Items List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#69808e]">
              Local Queue ({queue.length})
            </span>
            <button
              type="button"
              onClick={refreshList}
              className="text-[11px] font-medium text-[#167a4c] hover:underline"
            >
              Refresh
            </button>
          </div>

          {queue.length === 0 ? (
            <div className="grid place-items-center rounded-lg border-2 border-dashed border-[#b9dcc3] bg-[#f7faf7] p-8 text-center">
              <div className="grid size-12 place-items-center rounded-full bg-[#167a4c]/15 text-[#167a4c]">
                <CheckCircle2 size={26} />
              </div>
              <h3 className="mt-3 font-display font-semibold text-[#123148]">Ledger Clean & Up to Date</h3>
              <p className="mt-1 max-w-xs text-xs text-[#57707f]">
                No pending uploads in your browser store. Any new household or child registered while offline will appear
                here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {queue.map((item) => {
                const isHousehold = item.entity === "household";
                const h = isHousehold ? (item.payload as Household) : null;
                const c = !isHousehold ? (item.payload as Child) : null;

                const title = isHousehold
                  ? h?.householdCode || "New Household Draft"
                  : `${c?.firstName || ""} ${c?.middleName ? c.middleName + " " : ""}${c?.surname || ""}`.trim() ||
                    "Child Profile";

                const subtitle = isHousehold
                  ? h?.headName || "Household Head Contact"
                  : c?.isAlmajiri
                  ? "Almajiri Scholar (Tsangaya)"
                  : `Ward: ${c?.community || "Formal Ward"}`;

                const dateStr = item.createdAt
                  ? new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "Recently";

                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-md border border-[#c7d2d6] bg-white p-3 shadow-xs"
                  >
                    <div
                      className={`grid size-9 shrink-0 place-items-center rounded-md ${
                        isHousehold ? "bg-[#fbf2df] text-[#c88b25]" : "bg-[#eff5f1] text-[#167a4c]"
                      }`}
                    >
                      {isHousehold ? <Home size={17} /> : <GraduationCap size={17} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="truncate text-xs font-bold text-[#123148]">{title}</p>
                        <span className="shrink-0 rounded bg-[#fbf2df] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[#815813]">
                          PENDING
                        </span>
                      </div>
                      <p className="truncate text-[11px] text-[#57707f]">{subtitle}</p>
                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#869ba6]">
                        <span className="font-mono">ID: {item.tempId.slice(0, 8)}…</span>
                        <span>{dateStr}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-[#cfd9d2] bg-[#f4f6f4] px-5 py-3 text-center">
          <p className="font-mono text-[10px] text-[#69808e]">
            AREWA MISSION 2050 · RESILIENT FIELD ENGINE v2.4
          </p>
        </footer>
      </aside>
    </div>
  );
}
