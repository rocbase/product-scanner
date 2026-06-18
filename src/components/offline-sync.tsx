"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { syncOfflineQueue } from "@/lib/offline/sync";

export function OfflineSync() {
  useEffect(() => {
    const run = async () => {
      const count = await syncOfflineQueue();
      if (count > 0) {
        toast.success(`Synced ${count} offline scan${count === 1 ? "" : "s"}`);
        window.dispatchEvent(new Event("scans-updated"));
      }
    };

    run();
    window.addEventListener("online", run);
    return () => window.removeEventListener("online", run);
  }, []);

  return null;
}