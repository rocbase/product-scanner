"use client";

import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { buildListingPack } from "@/lib/share/listing-pack";
import type { Listing } from "@/types";

type ShareListingButtonProps = {
  listing: Listing;
  photos: string[];
  onShared?: () => void;
};

function absolutePhotoUrl(url: string): string {
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  const base = window.location.origin;
  return `${base}${url}`;
}

export function ShareListingButton({
  listing,
  photos,
  onShared,
}: ShareListingButtonProps) {
  const handleShare = async () => {
    try {
      const files: File[] = [];
      for (const url of photos.slice(0, 5)) {
        try {
          const res = await fetch(absolutePhotoUrl(url));
          const blob = await res.blob();
          const ext = blob.type.includes("png") ? "png" : "jpg";
          files.push(
            new File([blob], `photo-${files.length + 1}.${ext}`, { type: blob.type })
          );
        } catch {
          // Skip photos that fail to fetch
        }
      }

      const shareData: ShareData = {
        title: listing.title,
        text: buildListingPack(listing),
      };

      if (files.length && navigator.canShare?.({ files })) {
        await navigator.share({ ...shareData, files });
      } else if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(buildListingPack(listing));
        toast.success("Listing copied — paste into your marketplace app");
        onShared?.();
        return;
      }
      toast.success("Shared — pick Facebook, Mercari, or another app");
      onShared?.();
    } catch {
      toast.error("Share failed — try Copy instead");
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildListingPack(listing));
    toast.success("Listing copied to clipboard");
    onShared?.();
  };

  return (
    <div className="flex gap-2">
      <Button className="h-12 flex-1" onClick={handleShare}>
        <Share2 className="mr-2 h-4 w-4" />
        Share to App
      </Button>
      <Button variant="outline" className="h-12 flex-1" onClick={handleCopy}>
        <Copy className="mr-2 h-4 w-4" />
        Copy
      </Button>
    </div>
  );
}