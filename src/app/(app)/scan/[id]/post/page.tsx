"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ExternalLink, Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/error-state";
import { LoadingPage } from "@/components/loading-page";
import { ShareListingButton } from "@/components/share-listing-button";
import { MARKETPLACE_LINKS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { Listing, MarketplacePost } from "@/types";

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [posts, setPosts] = useState<MarketplacePost[]>([]);
  const [ebayLoading, setEbayLoading] = useState(false);
  const [ebayUrl, setEbayUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
          return;
        }
        setListing(d.listing);
        setPosts(d.posts ?? []);
        const ebayPost = (d.posts ?? []).find(
          (p: MarketplacePost) => p.marketplace === "ebay" && p.external_url
        );
        if (ebayPost?.external_url) setEbayUrl(ebayPost.external_url);
      });
  }, [id]);

  const postEbay = async () => {
    setEbayLoading(true);
    try {
      const res = await fetch("/api/post-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId: id, marketplace: "ebay" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "eBay post failed", { description: data.hint });
        return;
      }
      setEbayUrl(data.url ?? null);
      toast.success("Listed on eBay");
      const listingRes = await fetch(`/api/listings/${id}`);
      const listingData = await listingRes.json();
      setPosts(listingData.posts ?? []);
    } finally {
      setEbayLoading(false);
    }
  };

  const markShared = async () => {
    await fetch("/api/post-listing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scanId: id, marketplace: "share" }),
    });
    router.push("/history");
  };

  if (error) {
    return (
      <ErrorState
        title="Listing not found"
        message="Generate a listing first from the results screen."
        actionLabel="Back to Scan"
        onAction={() => router.push("/scan")}
      />
    );
  }

  if (!listing) return <LoadingPage label="Loading listing…" />;

  const searchQuery = listing.title;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Post listing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Post directly to eBay or share to Facebook Marketplace, Mercari, and more.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <p className="font-semibold">{listing.title}</p>
        <p className="mt-1 text-2xl font-bold">
          ${(listing.price_cents / 100).toFixed(2)}
        </p>
      </div>

      <div className="space-y-3">
        <Button
          className="h-14 w-full text-base"
          onClick={postEbay}
          disabled={ebayLoading}
        >
          {ebayLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <ShoppingBag className="mr-2 h-5 w-5" />
          )}
          Post to eBay
        </Button>

        {ebayUrl && (
          <a
            href={ebayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-primary"
          >
            View on eBay <ExternalLink className="h-4 w-4" />
          </a>
        )}

        <ShareListingButton
          listing={listing}
          photos={listing.photo_order}
          onShared={markShared}
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Open marketplace apps</p>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["Facebook", MARKETPLACE_LINKS.facebook(searchQuery)],
              ["Mercari", MARKETPLACE_LINKS.mercari(searchQuery)],
              ["OfferUp", MARKETPLACE_LINKS.offerup(searchQuery)],
              ["eBay Sell", MARKETPLACE_LINKS.ebay(searchQuery)],
            ] as const
          ).map(([label, href]) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center justify-center rounded-xl border bg-card text-sm font-medium active:bg-muted"
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      {posts.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Post history</p>
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm"
            >
              <span className="capitalize">{post.marketplace}</span>
              <div className="flex items-center gap-2">
                <Badge
                  variant={post.status === "posted" ? "default" : "destructive"}
                >
                  {post.status}
                </Badge>
                {post.posted_at && (
                  <span className="text-xs text-muted-foreground">
                    {formatDate(post.posted_at)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}