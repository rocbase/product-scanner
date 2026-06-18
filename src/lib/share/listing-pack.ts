import type { Listing } from "@/types";
import { formatPrice } from "@/lib/format";

export function buildListingPack(listing: Listing): string {
  return [
    listing.title,
    "",
    listing.description,
    "",
    `Price: ${formatPrice(listing.price_cents)}`,
    `Condition: ${listing.condition.replace(/_/g, " ")}`,
  ].join("\n");
}

export async function shareListing(
  listing: Listing,
  photoUrls: string[]
): Promise<boolean> {
  if (!navigator.share) return false;

  const files: File[] = [];
  for (const url of photoUrls.slice(0, 5)) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const ext = blob.type.includes("png") ? "png" : "jpg";
      files.push(new File([blob], `photo-${files.length + 1}.${ext}`, { type: blob.type }));
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
  } else {
    await navigator.share(shareData);
  }
  return true;
}