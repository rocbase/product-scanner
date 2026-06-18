import { NextResponse } from "next/server";
import { badRequest, notFound, serverError, serviceUnavailable } from "@/lib/api/errors";
import { allowDemoMode, hasEbay, hasSerpApi } from "@/lib/env";
import { searchEbay } from "@/lib/marketplaces/ebay-search";
import { searchGoogleShopping } from "@/lib/marketplaces/serp-shopping";
import * as store from "@/lib/store";
import type { PriceResult } from "@/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { scanId: string };
    const scan = await store.getScan(body.scanId);
    if (!scan?.ai_result) return badRequest("Scan must be identified first");

    const queries =
      scan.user_edits?.search_queries ??
      scan.ai_result.search_queries ??
      [scan.ai_result.product_name];
    const query = queries[0] || scan.ai_result.product_name;

    const results: Omit<PriceResult, "id" | "scan_id" | "fetched_at">[] = [];
    const errors: string[] = [];

    if (hasEbay()) {
      try {
        results.push(...(await searchEbay(query)));
      } catch (e) {
        errors.push(e instanceof Error ? e.message : "eBay search failed");
      }
    }

    if (hasSerpApi()) {
      try {
        results.push(...(await searchGoogleShopping(query)));
      } catch (e) {
        errors.push(e instanceof Error ? e.message : "Shopping search failed");
      }
    }

    if (!results.length) {
      if (allowDemoMode()) {
        const demo = await store.savePriceResults(body.scanId, [
          {
            marketplace: "ebay",
            title: `${scan.ai_result.product_name} - comparable listing`,
            price_cents: 4999,
            currency: "USD",
            condition: "Used",
            url: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`,
            image_url: scan.photos[0] ?? null,
          },
          {
            marketplace: "google_shopping",
            title: `${scan.ai_result.product_name} - retail comp`,
            price_cents: 7999,
            currency: "USD",
            condition: null,
            url: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`,
            image_url: null,
          },
        ]);
        return NextResponse.json({
          results: demo,
          demo: true,
          message: "Set API keys for live prices",
        });
      }
      return serviceUnavailable(
        "No marketplace APIs configured",
        errors.join("; ") ||
          "Add EBAY_CLIENT_ID/SECRET and/or SERPAPI_KEY to .env.local"
      );
    }

    const saved = await store.savePriceResults(body.scanId, results);
    return NextResponse.json({ results: saved, warnings: errors });
  } catch (error) {
    return serverError(error);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scanId = searchParams.get("scanId");
    if (!scanId) return badRequest("scanId is required");
    const scan = await store.getScan(scanId);
    if (!scan) return notFound("Scan not found");
    const results = await store.getPriceResults(scanId);
    return NextResponse.json({ results });
  } catch (error) {
    return serverError(error);
  }
}