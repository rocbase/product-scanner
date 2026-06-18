import OpenAI from "openai";
import type { ProductIdentification } from "@/types";

const SYSTEM_PROMPT = `You identify products from photos for resale research.
Return strict JSON only with this schema:
{
  "product_name": string,
  "brand": string,
  "model": string,
  "category": string,
  "search_queries": string[2-4],
  "confidence": number (0-1),
  "visible_text": string[],
  "condition_guess": "new" | "used_like_new" | "used_good" | "used_fair" | "for_parts"
}
Use brand+model in search_queries when visible. Be honest about uncertainty.`;

export async function identifyProduct(
  imageDataUrls: string[]
): Promise<ProductIdentification> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const openai = new OpenAI({ apiKey });
  const content: OpenAI.Chat.ChatCompletionContentPart[] = [
    {
      type: "text",
      text: "Identify this product for resale price research. Return JSON only.",
    },
    ...imageDataUrls.slice(0, 3).map((url) => ({
      type: "image_url" as const,
      image_url: { url, detail: "high" as const },
    })),
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("No identification returned from AI");

  const parsed = JSON.parse(raw) as ProductIdentification;
  if (!parsed.search_queries?.length) {
    parsed.search_queries = [
      [parsed.brand, parsed.model].filter(Boolean).join(" "),
      parsed.product_name,
    ].filter(Boolean);
  }
  return parsed;
}