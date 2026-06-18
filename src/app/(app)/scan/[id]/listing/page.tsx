"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/error-state";
import { ListingEditor } from "@/components/listing-editor";
import { LoadingPage } from "@/components/loading-page";
import { hydrateSettings } from "@/lib/settings";
import type { Listing } from "@/types";

export default function ListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    const settings = await hydrateSettings();
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
      setError(data.error);
      return null;
    }
    setListing(data.listing);
    return data.listing;
  };

  const load = async () => {
    const res = await fetch(`/api/listings/${id}`);
    if (res.status === 404) {
      await generate();
      return;
    }
    const data = await res.json();
    if (data.error) {
      setError(data.error);
      return;
    }
    setListing(data.listing);
  };

  useEffect(() => {
    load();
  }, [id]);

  const update = async (patch: Partial<Listing>) => {
    if (!listing) return;
    const next = { ...listing, ...patch };
    setListing(next);
    await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  };

  const regenerate = async () => {
    setRegenerating(true);
    try {
      await generate();
      toast.success("Listing regenerated");
    } finally {
      setRegenerating(false);
    }
  };

  if (error) {
    return (
      <ErrorState
        title="Could not create listing"
        message={error}
        actionLabel="Back to Results"
        onAction={() => router.push(`/scan/${id}/results`)}
      />
    );
  }

  if (!listing) return <LoadingPage label="Writing listing…" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Listing draft</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI wrote this from your photos and comp prices. Edit before posting.
        </p>
      </div>

      <ListingEditor listing={listing} onChange={update} />

      <Button
        variant="outline"
        className="h-12 w-full"
        onClick={regenerate}
        disabled={regenerating}
      >
        {regenerating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        Regenerate with AI
      </Button>

      <Button
        className="h-14 w-full text-base"
        onClick={() => router.push(`/scan/${id}/post`)}
      >
        Continue to Post
      </Button>
    </div>
  );
}