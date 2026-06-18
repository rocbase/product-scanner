import { listPendingQueue, markQueueSynced } from "@/lib/offline/queue";

export async function syncOfflineQueue(): Promise<number> {
  if (!navigator.onLine) return 0;

  const pending = await listPendingQueue();
  let synced = 0;

  for (const item of pending) {
    try {
      const scanRes = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: item.photos }),
      });
      if (!scanRes.ok) continue;

      const { scan } = await scanRes.json();
      await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId: scan.id }),
      });

      await markQueueSynced(item.id);
      synced++;
    } catch {
      break;
    }
  }

  return synced;
}