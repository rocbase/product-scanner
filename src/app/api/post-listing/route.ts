import { NextResponse } from "next/server";
import { getValidEbayTokens } from "@/lib/ebay-oauth";
import { notFound, serverError } from "@/lib/api/errors";
import { publishEbayListing } from "@/lib/marketplaces/ebay-sell";
import * as store from "@/lib/store";
import { normalizePhotoUrls } from "@/lib/storage/photos";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      scanId: string;
      marketplace: "ebay" | "share" | "copy";
    };

    const scan = await store.getScan(body.scanId);
    const listing = await store.getListingByScan(body.scanId);
    if (!scan || !listing) return notFound("Listing not found");

    if (body.marketplace === "ebay") {
      let tokens = await getValidEbayTokens();

      if (!tokens && process.env.EBAY_SELLER_TOKENS_JSON) {
        try {
          tokens = JSON.parse(process.env.EBAY_SELLER_TOKENS_JSON);
        } catch {
          tokens = null;
        }
      }

      if (!tokens) {
        return NextResponse.json(
          {
            error: "eBay seller account not connected",
            hint: "Connect your eBay seller account in Settings",
          },
          { status: 400 }
        );
      }

      try {
        const published = await publishEbayListing({
          title: listing.title,
          description: listing.description,
          price_cents: listing.price_cents,
          condition: listing.condition,
          photo_urls: normalizePhotoUrls(listing.photo_order),
          tokens,
        });

        await store.saveMarketplacePost(listing.id, {
          marketplace: "ebay",
          status: "posted",
          external_listing_id: published.listingId,
          external_url: published.url,
          error_message: null,
          posted_at: new Date().toISOString(),
        });
        await store.saveListing(body.scanId, { ...listing, status: "posted" });
        await store.updateScan(body.scanId, { status: "posted" });

        return NextResponse.json({ ok: true, url: published.url });
      } catch (error) {
        await store.saveMarketplacePost(listing.id, {
          marketplace: "ebay",
          status: "failed",
          external_listing_id: null,
          external_url: null,
          error_message: error instanceof Error ? error.message : "Post failed",
          posted_at: null,
        });
        return serverError(error);
      }
    }

    await store.saveMarketplacePost(listing.id, {
      marketplace: body.marketplace === "share" ? "facebook" : "other",
      status: "posted",
      external_listing_id: null,
      external_url: null,
      error_message: null,
      posted_at: new Date().toISOString(),
    });
    await store.updateScan(body.scanId, { status: "posted" });

    return NextResponse.json({ ok: true, assisted: true });
  } catch (error) {
    return serverError(error);
  }
}