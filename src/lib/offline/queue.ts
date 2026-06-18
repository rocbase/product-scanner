import Dexie, { type Table } from "dexie";

export type QueuedScan = {
  id: string;
  photos: string[];
  created_at: string;
  synced: boolean;
};

class OfflineDB extends Dexie {
  queue!: Table<QueuedScan, string>;

  constructor() {
    super("product-scanner");
    this.version(1).stores({ queue: "id, synced, created_at" });
  }
}

let db: OfflineDB | null = null;

function getDb() {
  if (typeof window === "undefined") return null;
  if (!db) db = new OfflineDB();
  return db;
}

export async function queueOfflinePhotos(photos: string[]): Promise<string> {
  const database = getDb();
  if (!database) throw new Error("Offline storage unavailable");
  const id = crypto.randomUUID();
  await database.queue.add({
    id,
    photos,
    created_at: new Date().toISOString(),
    synced: false,
  });
  return id;
}

export async function getPendingQueueCount(): Promise<number> {
  const database = getDb();
  if (!database) return 0;
  return database.queue.where("synced").equals(0).count();
}

export async function listPendingQueue(): Promise<QueuedScan[]> {
  const database = getDb();
  if (!database) return [];
  return database.queue.where("synced").equals(0).sortBy("created_at");
}

export async function markQueueSynced(id: string) {
  const database = getDb();
  if (!database) return;
  await database.queue.update(id, { synced: true });
}