"use client";

import Link from "next/link";
import { Bookmark, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { Scan } from "@/types";

export function ScanCard({ scan }: { scan: Scan }) {
  const name =
    scan.user_edits?.product_name ??
    scan.ai_result?.product_name ??
    "Unidentified item";
  const href =
    scan.status === "identified" || scan.status === "pending"
      ? `/scan/${scan.id}/review`
      : scan.status === "listing" || scan.status === "posted"
        ? `/scan/${scan.id}/listing`
        : `/scan/${scan.id}/results`;

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border bg-card p-3 active:bg-muted/50"
    >
      {scan.photos[0] ? (
        <img
          src={scan.photos[0]}
          alt=""
          className="h-16 w-16 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <div className="h-16 w-16 shrink-0 rounded-xl bg-muted" />
      )}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 truncate font-medium">
          {scan.bookmarked && <Bookmark className="h-3 w-3 shrink-0 fill-amber-500 text-amber-500" />}
          {name}
        </p>
        <p className="text-sm text-muted-foreground">{formatDate(scan.created_at)}</p>
        <Badge variant="secondary" className="mt-1 capitalize">
          {scan.status}
        </Badge>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}