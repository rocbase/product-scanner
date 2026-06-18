"use client";

import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import type { PriceResult } from "@/types";

export function PriceResultCard({ result }: { result: PriceResult }) {
  return (
    <a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 rounded-2xl border bg-card p-3 active:bg-muted/50"
    >
      {result.image_url ? (
        <img
          src={result.image_url}
          alt=""
          className="h-16 w-16 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <div className="h-16 w-16 shrink-0 rounded-xl bg-muted" />
      )}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium">{result.title}</p>
        <p className="mt-1 text-xl font-bold tracking-tight">
          {formatPrice(result.price_cents, result.currency)}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {result.marketplace.replace("_", " ")}
          </Badge>
          {result.condition && (
            <span className="text-xs text-muted-foreground">{result.condition}</span>
          )}
        </div>
      </div>
      <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
    </a>
  );
}