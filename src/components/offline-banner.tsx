"use client";

import { useEffect, useState } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { getPendingQueueCount } from "@/lib/offline/queue";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const refresh = async () => {
      setOffline(!navigator.onLine);
      setPending(await getPendingQueueCount());
    };
    refresh();
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    window.addEventListener("scans-updated", refresh);
    return () => {
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      window.removeEventListener("scans-updated", refresh);
    };
  }, []);

  if (!offline && pending === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
      {offline ? <CloudOff className="h-4 w-4 shrink-0" /> : <RefreshCw className="h-4 w-4 shrink-0" />}
      <span>
        {offline
          ? "You're offline — photos will queue for sync"
          : `${pending} scan${pending === 1 ? "" : "s"} waiting to sync`}
      </span>
    </div>
  );
}