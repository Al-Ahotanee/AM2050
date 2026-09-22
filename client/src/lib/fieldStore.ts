/* AM2050 — Field Ledger Modernism: local field records are backed by IndexedDB for high-capacity offline storage with memory caching and localStorage fallback. */
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

const DB_NAME = "am2050_offline_db";
const DB_VERSION = 1;
const STORES = {
  households: "households",
  children: "children",
  syncQueue: "sync_queue",
} as const;

const LS_KEYS = {
  households: "am2050_households",
  children: "am2050_children",
  syncQueue: "am2050_sync_queue",
};

// In-memory cache for synchronous access
let cachedHouseholds: Household[] = [];
let cachedChildren: Child[] = [];
let cachedSyncQueue: SyncOperation[] = [];
let dbPromise: Promise<IDBDatabase | null> | null = null;

function readLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded in localStorage is gracefully handled because IndexedDB is primary
  }
}

// Initialise memory cache from localStorage immediately
if (typeof window !== "undefined") {
  cachedHouseholds = readLocalStorage<Household[]>(LS_KEYS.households, []);
  cachedChildren = readLocalStorage<Child[]>(LS_KEYS.children, []);
  cachedSyncQueue = readLocalStorage<SyncOperation[]>(LS_KEYS.syncQueue, []);
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.resolve(null);
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase | null>((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORES.households)) {
          db.createObjectStore(STORES.households, { keyPath: "localId" });
        }
        if (!db.objectStoreNames.contains(STORES.children)) {
          db.createObjectStore(STORES.children, { keyPath: "localId" });
        }
        if (!db.objectStoreNames.contains(STORES.syncQueue)) {
          db.createObjectStore(STORES.syncQueue, { keyPath: "id" });
        }
      };

      request.onsuccess = async (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // On success, hydrate memory cache from IndexedDB
        await hydrateFromIdb(db);
        resolve(db);
      };

      request.onerror = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
}

async function hydrateFromIdb(db: IDBDatabase): Promise<void> {
  try {
    const tx = db.transaction([STORES.households, STORES.children, STORES.syncQueue], "readonly");
    const hReq = tx.objectStore(STORES.households).getAll();
    const cReq = tx.objectStore(STORES.children).getAll();
    const qReq = tx.objectStore(STORES.syncQueue).getAll();

    await new Promise<void>((res) => {
      tx.oncomplete = () => res();
      tx.onerror = () => res();
    });

    const hRows = (hReq.result as Household[]) || [];
    const cRows = (cReq.result as Child[]) || [];
    const qRows = (qReq.result as SyncOperation[]) || [];

    if (hRows.length > 0 || cRows.length > 0 || qRows.length > 0) {
      cachedHouseholds = hRows;
      cachedChildren = cRows;
      cachedSyncQueue = qRows;
    } else if (cachedHouseholds.length > 0 || cachedChildren.length > 0 || cachedSyncQueue.length > 0) {
      // Migrate initial localStorage data into IDB
      await persistAllToIdb(cachedHouseholds, cachedChildren, cachedSyncQueue);
    }
  } catch {
    // Continue with in-memory cache
  }
}

async function persistAllToIdb(households: Household[], children: Child[], queue: SyncOperation[]): Promise<void> {
  const db = await openDatabase();
  if (!db) return;
  try {
    const tx = db.transaction([STORES.households, STORES.children, STORES.syncQueue], "readwrite");
    const hStore = tx.objectStore(STORES.households);
    const cStore = tx.objectStore(STORES.children);
    const qStore = tx.objectStore(STORES.syncQueue);

    hStore.clear();
    for (const h of households) hStore.put(h);

    cStore.clear();
    for (const c of children) cStore.put(c);

    qStore.clear();
    for (const q of queue) qStore.put(q);
  } catch {
    // best-effort
  }
}

// Automatically start IDB initialization in background
if (typeof window !== "undefined") {
  void openDatabase();
}

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function localId() {
  let time = Date.now();
  let id = "";
  for (let index = 0; index < 10; index += 1) {
    id = CROCKFORD[time % 32] + id;
    time = Math.floor(time / 32);
  }
  for (let index = 0; index < 16; index += 1) {
    id += CROCKFORD[Math.floor(Math.random() * CROCKFORD.length)];
  }
  return id;
}
function day() {
  return new Date().toISOString().slice(0, 10);
}
function timestamp() {
  return new Date().toISOString();
}

export function getHouseholds(): Household[] {
  return cachedHouseholds;
}

export function getChildren(): Child[] {
  return cachedChildren;
}

export function getSyncQueue(): SyncOperation[] {
  return cachedSyncQueue;
}

export function enqueueSync(operation: Omit<SyncOperation, "id" | "createdAt">) {
  const record: SyncOperation = { ...operation, id: localId(), createdAt: timestamp() };
  cachedSyncQueue = [...cachedSyncQueue, record];
  writeLocalStorage(LS_KEYS.syncQueue, cachedSyncQueue);
  void persistAllToIdb(cachedHouseholds, cachedChildren, cachedSyncQueue);
  return record;
}

export function createLocalHousehold(input: Omit<Household, "localId" | "householdCode" | "status" | "createdAt">) {
  const record: Household = {
    ...input,
    localId: localId(),
    householdCode: `DRAFT-${String(cachedHouseholds.length + 1).padStart(4, "0")}`,
    status: "pending",
    createdAt: day(),
  };
  cachedHouseholds = [record, ...cachedHouseholds];
  writeLocalStorage(LS_KEYS.households, cachedHouseholds);
  void persistAllToIdb(cachedHouseholds, cachedChildren, cachedSyncQueue);
  enqueueSync({ entity: "household", action: "create", tempId: record.localId, payload: record });
  return record;
}

export function createLocalChild(input: Omit<Child, "localId" | "status" | "createdAt" | "childUniqueId">) {
  const record: Child = {
    ...input,
    localId: localId(),
    status: "pending",
    createdAt: day(),
  };
  cachedChildren = [record, ...cachedChildren];
  writeLocalStorage(LS_KEYS.children, cachedChildren);
  void persistAllToIdb(cachedHouseholds, cachedChildren, cachedSyncQueue);
  enqueueSync({ entity: "child", action: "create", tempId: record.localId, payload: record });
  return record;
}

export function pendingSyncCount() {
  return cachedSyncQueue.length;
}

export function applySyncOutcomes(
  outcomes: Array<{ tempId: string; status: "synced" | "already_synced" | "conflict" | "error"; code?: string }>
) {
  const completed = new Map(
    outcomes
      .filter((item) => item.status === "synced" || item.status === "already_synced")
      .map((item) => [item.tempId, item])
  );
  if (!completed.size) return;

  cachedHouseholds = cachedHouseholds.map((row) => {
    const result = completed.get(row.localId);
    return result ? { ...row, status: "synced" as const, householdCode: result.code ?? row.householdCode } : row;
  });

  cachedChildren = cachedChildren.map((row) => {
    const result = completed.get(row.localId);
    return result ? { ...row, status: "synced" as const, childUniqueId: result.code ?? row.childUniqueId } : row;
  });

  cachedSyncQueue = cachedSyncQueue.filter((item) => !completed.has(item.tempId));

  writeLocalStorage(LS_KEYS.households, cachedHouseholds);
  writeLocalStorage(LS_KEYS.children, cachedChildren);
  writeLocalStorage(LS_KEYS.syncQueue, cachedSyncQueue);
  void persistAllToIdb(cachedHouseholds, cachedChildren, cachedSyncQueue);
}

export function fullName(child: Pick<Child, "firstName" | "middleName" | "surname">) {
  return [child.firstName, child.middleName, child.surname].filter(Boolean).join(" ");
}
