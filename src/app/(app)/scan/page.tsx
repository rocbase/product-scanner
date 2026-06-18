"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CameraCapture } from "@/components/camera-capture";
import { ScanCard } from "@/components/scan-card";
import type { Scan } from "@/types";

export default function ScanPage() {
  const router = useRouter();
  const [recent, setRecent] = useState<Scan[]>([]);

  const loadRecent = () => {
    fetch("/api/scans")
      .then((r) => r.json())
      .then((d) => setRecent((d.scans ?? []).slice(0, 5)));
  };

  useEffect(() => {
    loadRecent();
    window.addEventListener("scans-updated", loadRecent);
    return () => window.removeEventListener("scans-updated", loadRecent);
  }, []);

  const handleCapture = async (photos: string[]) => {
    const res = await fetch("/api/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photos }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Failed to save scan");
      return;
    }

    const identifyRes = await fetch("/api/identify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scanId: data.scan.id }),
    });
    const identifyData = await identifyRes.json();
    if (!identifyRes.ok) {
      toast.error(identifyData.error, { description: identifyData.hint });
      router.push(`/scan/${data.scan.id}/review`);
      return;
    }
    if (identifyData.demo) toast.message(identifyData.message);
    router.push(`/scan/${data.scan.id}/review`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Scan Product</h1>
        <p className="mt-1 text-muted-foreground">
          Photograph an item to identify it and check marketplace prices.
        </p>
      </div>

      <CameraCapture onCapture={handleCapture} />

      {recent.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recent scans
          </h2>
          {recent.map((scan) => (
            <ScanCard key={scan.id} scan={scan} />
          ))}
        </div>
      )}
    </div>
  );
}