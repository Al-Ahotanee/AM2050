/* AM2050 — Field Ledger Modernism: local field records are explicit drafts, never disguised as server-confirmed data. */
export type Household = {
  localId: string;
  householdCode: string;
  headName: string;
  guardianPhone: string;
  community: string;
  ward: string;
  gps: string;
  status: "synced" | "pending";
  createdAt: string;
};

export type Child = {
  localId: string;
  childUniqueId?: string;
  firstName: string;
  middleName?: string;
  surname: string;
  dateOfBirth: string;
  gender: string;
  householdId: string;
  guardianName: string;
  guardianPhone: string;
  community: string;
  disabilityStatus: string;
  isAlmajiri: boolean;
  gps: string;
  photoName?: string;
  status: "synced" | "pending";
  createdAt: string;
};

export type SyncOperation = {
  id: string;
  entity: "household" | "child";
  action: "create" | "update";
  tempId: string;
  payload: Household | Child;
  createdAt: string;
};

const KEYS = { households: "am2050_households", children: "am2050_children", syncQueue: "am2050_sync_queue" };

const initialHouseholds: Household[] = [];
const initialChildren: Child[] = [];

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const value = window.localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}

function write<T>(key: string, value: T) { window.localStorage.setItem(key, JSON.stringify(value)); }
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function localId() { let time = Date.now(); let id = ""; for (let index = 0; index < 10; index += 1) { id = CROCKFORD[time % 32] + id; time = Math.floor(time / 32); } for (let index = 0; index < 16; index += 1) id += CROCKFORD[Math.floor(Math.random() * CROCKFORD.length)]; return id; }
function day() { return new Date().toISOString().slice(0, 10); }
function timestamp() { return new Date().toISOString(); }

export function getHouseholds() { return read<Household[]>(KEYS.households, initialHouseholds); }
export function getChildren() { return read<Child[]>(KEYS.children, initialChildren); }
export function getSyncQueue() { return read<SyncOperation[]>(KEYS.syncQueue, []); }
export function enqueueSync(operation: Omit<SyncOperation, "id" | "createdAt">) { const queue = getSyncQueue(); const record = { ...operation, id: localId(), createdAt: timestamp() }; write(KEYS.syncQueue, [...queue, record]); return record; }

export function createLocalHousehold(input: Omit<Household, "localId" | "householdCode" | "status" | "createdAt">) {
  const rows = getHouseholds();
  const record: Household = { ...input, localId: localId(), householdCode: `DRAFT-${String(rows.length + 1).padStart(4, "0")}`, status: "pending", createdAt: day() };
  write(KEYS.households, [record, ...rows]);
  enqueueSync({ entity: "household", action: "create", tempId: record.localId, payload: record });
  return record;
}

export function createLocalChild(input: Omit<Child, "localId" | "status" | "createdAt" | "childUniqueId">) {
  const rows = getChildren();
  const record: Child = { ...input, localId: localId(), status: "pending", createdAt: day() };
  write(KEYS.children, [record, ...rows]);
  enqueueSync({ entity: "child", action: "create", tempId: record.localId, payload: record });
  return record;
}

export function pendingSyncCount() { return getSyncQueue().length; }
export function applySyncOutcomes(outcomes: Array<{ tempId: string; status: "synced" | "already_synced" | "conflict" | "error"; code?: string }>) {
  const completed = new Map(outcomes.filter((item) => item.status === "synced" || item.status === "already_synced").map((item) => [item.tempId, item]));
  if (!completed.size) return;
  write(KEYS.households, getHouseholds().map((row) => { const result = completed.get(row.localId); return result ? { ...row, status: "synced" as const, householdCode: result.code ?? row.householdCode } : row; }));
  write(KEYS.children, getChildren().map((row) => { const result = completed.get(row.localId); return result ? { ...row, status: "synced" as const, childUniqueId: result.code ?? row.childUniqueId } : row; }));
  write(KEYS.syncQueue, getSyncQueue().filter((item) => !completed.has(item.tempId)));
}
export function fullName(child: Pick<Child, "firstName" | "middleName" | "surname">) { return [child.firstName, child.middleName, child.surname].filter(Boolean).join(" "); }
