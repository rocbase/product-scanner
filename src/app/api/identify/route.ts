import { NextResponse } from "next/server";
import { identifyProduct } from "@/lib/ai/identify-product";
import { notFound, serverError, serviceUnavailable } from "@/lib/api/errors";
import { allowDemoMode, hasOpenAI } from "@/lib/env";
import * as store from "@/lib/store";
import { photosForAI } from "@/lib/storage/photos";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { scanId: string };
    const scan = await store.getScan(body.scanId);
    if (!scan) return notFound("Scan not found");

    if (!hasOpenAI()) {
      if (!allowDemoMode()) {
        return serviceUnavailable(
          "AI identification is not configured",
          "Add OPENAI_API_KEY to .env.local or set DEMO_MODE=true for mock data"
        );
      }
      const mock = await store.saveIdentification(body.scanId, {
        product_name: "Sample Product (demo)",
        brand: "Unknown",
        model: "",
        category: "General",
        search_queries: ["vintage item resale", "collectible item"],
        confidence: 0.5,
        visible_text: [],
        condition_guess: "used_good",
      });
      return NextResponse.json({
        scan: mock,
        demo: true,
        message: "Set OPENAI_API_KEY for real identification",
      });
    }

    const ai_result = await identifyProduct(photosForAI(scan.photos));
    const updated = await store.saveIdentification(body.scanId, ai_result);
    return NextResponse.json({ scan: updated });
  } catch (error) {
    return serverError(error);
  }
}