import OpenAI from "openai";
import type { ListingDraft, PriceResult, ProductIdentification } from "@/types";
import { summarizePrices } from "@/lib/format";

const SYSTEM_PROMPT = `You write honest marketplace listings for resale sellers.
Return strict JSON only:
{
  "title": string (max 80 chars, brand+model first),
  "description": string (2-4 short paragraphs, honest flaws),
  "suggested_price_cents": number,
  "condition": "new" | "used_like_new" | "used_good" | "used_fair" | "for_parts",
  "ebay_category_hint": string,
  "bullet_points": string[],
  "seo_keywords": string[]
}
Price should be competitive vs comps (slightly below median when comps exist).`;

type GenerateListingInput = {
  identification: ProductIdentification;
  userEdits?: Partial<ProductIdentification> | null;
  priceResults: PriceResult[];
  costCents?: number | null;
};

export async function generateListing(
  input: GenerateListingInput
): Promise<ListingDraft> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const id = { ...input.identification, ...input.userEdits };
  const summary = summarizePrices(
    input.priceResults.map((r) => r.price_cents).filter((p) => p > 0)
  );

  const openai = new OpenAI({ apiKey });
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          product: id,
          comp_prices: summary,
          your_cost_cents: input.costCents ?? null,
        }),
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("No listing draft returned from AI");
  return JSON.parse(raw) as ListingDraft;
}