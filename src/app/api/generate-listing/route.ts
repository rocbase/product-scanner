import { NextResponse } from "next/server";
import { generateListing } from "@/lib/ai/generate-listing";
import { badRequest, serverError, serviceUnavailable } from "@/lib/api/errors";
import { allowDemoMode, hasOpenAI } from "@/lib/env";
import * as store from "@/lib/store";
import { summarizePrices } from "@/lib/format";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      scanId: string;
      listingFooter?: string;
    };
    const scan = await store.getScan(body.scanId);
    if (!scan?.ai_result) return badRequest("Scan must be identified first");

    const priceResults = await store.getPriceResults(body.scanId);
    const summary = summarizePrices(
      priceResults.map((r) => r.price_cents).filter((p) => p > 0)
    );
    const settings = await store.getUserSettings();
    const footer = body.listingFooter?.trim() || settings.listing_footer;

    let draft;
    if (!hasOpenAI()) {
      if (!allowDemoMode()) {
        return serviceUnavailable(
          "AI listing writer is not configured",
          "Add OPENAI_API_KEY to .env.local"
        );
      }
      const suggested =
        summary.median ??
        (scan.cost_cents
          ? Math.round(scan.cost_cents * (1 + settings.default_markup_percent / 100))
          : 4999);
      draft = {
        title: `${scan.ai_result.brand} ${scan.ai_result.model || scan.ai_result.product_name}`.trim(),
        description: `Selling ${scan.ai_result.product_name}. Item is in ${scan.ai_result.condition_guess.replace(/_/g, " ")} condition. Photos show actual item you will receive.`,
        suggested_price_cents: suggested,
        condition: scan.ai_result.condition_guess,
        bullet_points: ["Photos of actual item", "Fast shipping available"],
        seo_keywords: [scan.ai_result.brand, scan.ai_result.category].filter(Boolean),
      };
    } else {
      draft = await generateListing({
        identification: scan.ai_result,
        userEdits: scan.user_edits,
        priceResults,
        costCents: scan.cost_cents,
      });
    }

    const existing = await store.getListingByScan(body.scanId);
    const description =
      existing?.description ??
      (footer ? `${draft.description}\n\n${footer}` : draft.description);

    const listing = await store.saveListing(body.scanId, {
      title: existing?.title ?? draft.title,
      description,
      price_cents: existing?.price_cents ?? draft.suggested_price_cents,
      condition: existing?.condition ?? draft.condition,
      category: scan.ai_result.category,
      photo_order: scan.photos,
      ai_draft: draft,
      user_edits: null,
      status: "draft",
    });

    return NextResponse.json({ listing, draft });
  } catch (error) {
    return serverError(error);
  }
}