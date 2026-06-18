import { NextResponse } from "next/server";
import { notFound, serverError } from "@/lib/api/errors";
import * as store from "@/lib/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ scanId: string }> }
) {
  try {
    const { scanId } = await params;
    const listing = await store.getListingByScan(scanId);
    if (!listing) return notFound("Listing not found");
    const posts = await store.getPostsForListing(listing.id);
    return NextResponse.json({ listing, posts });
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ scanId: string }> }
) {
  try {
    const { scanId } = await params;
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      price_cents?: number;
      condition?: string;
      photo_order?: string[];
      status?: "draft" | "ready" | "posted";
    };

    const existing = await store.getListingByScan(scanId);
    if (!existing) return notFound("Listing not found");

    const listing = await store.saveListing(scanId, {
      ...existing,
      ...body,
      status: body.status ?? existing.status,
    });

    return NextResponse.json({ listing });
  } catch (error) {
    return serverError(error);
  }
}