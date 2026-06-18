"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bookmark, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ScanCard } from "@/components/scan-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Scan } from "@/types";

export default function HistoryPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [filter, setFilter] = useState<"all" | "priced" | "posted" | "bookmarked">("all");
  const [query, setQuery] = useState("");

  const load = useCallback(() => {
    fetch("/api/scans")
      .then((r) => r.json())
      .then((d) => setScans(d.scans ?? []));
  }, []);

  useEffect(() => {
    load();
    window.addEventListener("scans-updated", load);
    return () => window.removeEventListener("scans-updated", load);
  }, [load]);

  const remove = async (id: string) => {
    await fetch(`/api/scans?id=${id}`, { method: "DELETE" });
    setScans((prev) => prev.filter((s) => s.id !== id));
    toast.success("Scan deleted");
  };

  const filtered = useMemo(() => {
    return scans.filter((s) => {
      if (filter === "priced" && !(s.status === "priced" || s.status === "listing"))
        return false;
      if (filter === "posted" && s.status !== "posted") return false;
      if (filter === "bookmarked" && !s.bookmarked) return false;
      if (query) {
        const name =
          s.user_edits?.product_name ??
          s.ai_result?.product_name ??
          "";
        if (!name.toLowerCase().includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [scans, filter, query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">History</h1>
        <p className="mt-1 text-muted-foreground">
          {scans.length} scan{scans.length === 1 ? "" : "s"} total
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-12 pl-9"
          placeholder="Search products…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["all", "priced", "posted", "bookmarked"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium capitalize ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {f === "bookmarked" ? (
              <span className="flex items-center gap-1">
                <Bookmark className="h-3 w-3" /> Saved
              </span>
            ) : (
              f
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((scan) => (
          <div key={scan.id} className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <ScanCard scan={scan} />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => remove(scan.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {!filtered.length && (
          <p className="py-12 text-center text-muted-foreground">
            {query || filter !== "all"
              ? "No scans match your filter."
              : "No scans yet. Tap Scan to photograph your first product."}
          </p>
        )}
      </div>
    </div>
  );
}