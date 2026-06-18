"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, RefreshCw, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/error-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingPage } from "@/components/loading-page";
import { PriceResultCard } from "@/components/price-result-card";
import {
  computeMargin,
  formatDate,
  formatPercent,
  formatPrice,
  summarizePrices,
} from "@/lib/format";
import { hydrateSettings, loadSettings } from "@/lib/settings";
import type { PriceResult, Scan } from "@/types";

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [scan, setScan] = useState<Scan | null>(null);
  const [results, setResults] = useState<PriceResult[]>([]);
  const [cost, setCost] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [listingLoading, setListingLoading] = useState(false);
  const [settings, setSettings] = useState(loadSettings());
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const [scanRes, priceRes] = await Promise.all([
      fetch(`/api/scans/${id}`),
      fetch(`/api/search-prices?scanId=${id}`),
    ]);
    const scanData = await scanRes.json();
    const priceData = await priceRes.json();
    if (scanData.error) {
      setError(scanData.error);
      return;
    }
    setScan(scanData.scan);
    setResults(priceData.results ?? []);
    if (scanData.scan.cost_cents != null) {
      setCost((scanData.scan.cost_cents / 100).toFixed(2));
    }
  };

  useEffect(() => {
    hydrateSettings().then(setSettings);
    load();
  }, [id]);

  const summary = summarizePrices(results.map((r) => r.price_cents));
  const costCents = cost ? Math.round(parseFloat(cost) * 100) : null;
  const margin = summary.median != null ? computeMargin(summary.median, costCents) : null;
  const fetchedAt = results[0]?.fetched_at;

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/search-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error, { description: data.hint });
        return;
      }
      setResults(data.results ?? []);
      toast.success("Prices refreshed");
    } finally {
      setRefreshing(false);
    }
  };

  const saveCost = async () => {
    await fetch(`/api/scans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cost_cents: costCents }),
    });
  };

  const sellThis = async () => {
    setListingLoading(true);
    try {
      await saveCost();
      const res = await fetch("/api/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scanId: id,
          listingFooter: settings.listing_footer,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error, { description: data.hint });
        return;
      }
      router.push(`/scan/${id}/listing`);
    } catch {
      toast.error("Could not generate listing");
    } finally {
      setListingLoading(false);
    }
  };

  if (error) {
    return (
      <ErrorState
        title="Scan not found"
        message={error}
        actionLabel="Back to Scan"
        onAction={() => router.push("/scan")}
      />
    );
  }

  if (!scan) return <LoadingPage label="Loading prices…" />;

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-4 bg-background/95 px-4 py-3 backdrop-blur">
        <h1 className="text-xl font-bold">Market prices</h1>
        {fetchedAt && (
          <p className="text-xs text-muted-foreground">
            Updated {formatDate(fetchedAt)}
          </p>
        )}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-muted p-2">
            <p className="text-xs text-muted-foreground">Low</p>
            <p className="font-bold">
              {summary.low != null ? formatPrice(summary.low) : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-primary/10 p-2">
            <p className="text-xs text-muted-foreground">Median</p>
            <p className="text-lg font-bold text-primary">
              {summary.median != null ? formatPrice(summary.median) : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-muted p-2">
            <p className="text-xs text-muted-foreground">High</p>
            <p className="font-bold">
              {summary.high != null ? formatPrice(summary.high) : "—"}
            </p>
          </div>
        </div>
        {margin != null && (
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Est. margin at median:{" "}
            <span className={margin >= 0 ? "text-green-600" : "text-red-600"}>
              {formatPercent(margin)}
            </span>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cost">Your cost (optional)</Label>
        <Input
          id="cost"
          type="number"
          inputMode="decimal"
          step="0.01"
          placeholder="0.00"
          className="h-12"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          onBlur={saveCost}
        />
        {costCents != null && costCents > 0 && (
          <p className="text-xs text-muted-foreground">
            Suggested sell at {settings.default_markup_percent}% markup:{" "}
            <span className="font-medium text-foreground">
              {formatPrice(
                Math.round(costCents * (1 + settings.default_markup_percent / 100))
              )}
            </span>
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="h-12 flex-1" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button className="h-12 flex-1" onClick={sellThis} disabled={listingLoading}>
          {listingLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Tag className="mr-2 h-4 w-4" />
          )}
          Sell This
        </Button>
      </div>

      <div className="space-y-3">
        {results.map((result) => (
          <PriceResultCard key={result.id} result={result} />
        ))}
        {!results.length && (
          <p className="text-center text-muted-foreground">
            No comparable listings found. Try editing the product name and search again.
          </p>
        )}
      </div>
    </div>
  );
}