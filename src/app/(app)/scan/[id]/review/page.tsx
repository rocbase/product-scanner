"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Bookmark, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/error-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingPage } from "@/components/loading-page";
import { Textarea } from "@/components/ui/textarea";
import type { ProductIdentification, Scan } from "@/types";

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [scan, setScan] = useState<Scan | null>(null);
  const [fields, setFields] = useState<Partial<ProductIdentification>>({});
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/scans/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
          return;
        }
        setScan(d.scan);
        setFields({ ...d.scan.ai_result, ...d.scan.user_edits });
        setNotes(d.scan.notes ?? "");
      });
  }, [id]);

  const saveEdits = async () => {
    const res = await fetch(`/api/scans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_edits: fields, notes }),
    });
    const { scan: updated } = await res.json();
    setScan(updated);
  };

  const toggleBookmark = async () => {
    const res = await fetch(`/api/scans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookmarked: !scan?.bookmarked }),
    });
    const { scan: updated } = await res.json();
    setScan(updated);
  };

  const findPrices = async () => {
    setLoading(true);
    try {
      await saveEdits();
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
      if (data.demo) toast.message(data.message);
      router.push(`/scan/${id}/results`);
    } catch {
      toast.error("Price search failed");
    } finally {
      setLoading(false);
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

  if (!scan) return <LoadingPage label="Loading scan…" />;

  const confidence = scan.ai_result?.confidence ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Review identification</h1>
          <Badge
            variant={confidence > 0.7 ? "default" : "secondary"}
            className="mt-2"
          >
            {Math.round(confidence * 100)}% confidence
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleBookmark}
          className={scan.bookmarked ? "text-amber-500" : ""}
        >
          <Bookmark className={`h-5 w-5 ${scan.bookmarked ? "fill-current" : ""}`} />
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {scan.photos.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className="h-24 w-24 shrink-0 rounded-xl object-cover"
          />
        ))}
      </div>

      <div className="space-y-4">
        {(["product_name", "brand", "model", "category"] as const).map((key) => (
          <div key={key} className="space-y-2">
            <Label className="capitalize">{key.replace("_", " ")}</Label>
            <Input
              className="h-12"
              value={fields[key] ?? ""}
              onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
            />
          </div>
        ))}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            rows={2}
            placeholder="Where you found it, flaws to mention…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <Button className="h-14 w-full text-base" onClick={findPrices} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Searching marketplaces…
          </>
        ) : (
          <>
            <Search className="mr-2 h-5 w-5" />
            Find Prices
          </>
        )}
      </Button>
    </div>
  );
}