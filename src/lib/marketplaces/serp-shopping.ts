import type { PriceResult } from "@/types";

export async function searchGoogleShopping(
  query: string
): Promise<PriceResult[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) throw new Error("SERPAPI_KEY is not configured");

  const params = new URLSearchParams({
    engine: "google_shopping",
    q: query,
    api_key: apiKey,
    num: "10",
  });

  const res = await fetch(`https://serpapi.com/search.json?${params}`);
  if (!res.ok) throw new Error(`SerpAPI failed: ${res.status}`);

  const data = (await res.json()) as {
    shopping_results?: Array<{
      title: string;
      extracted_price?: number;
      price?: string;
      link: string;
      source?: string;
      thumbnail?: string;
    }>;
  };

  const fetchedAt = new Date().toISOString();
  const results: PriceResult[] = [];
  for (const item of data.shopping_results ?? []) {
    const price =
      item.extracted_price ??
      parseFloat((item.price ?? "").replace(/[^0-9.]/g, ""));
    if (!price || Number.isNaN(price)) continue;
    results.push({
      id: "",
      scan_id: "",
      marketplace: "google_shopping",
      title: item.title,
      price_cents: Math.round(price * 100),
      currency: "USD",
      condition: null,
      url: item.link,
      image_url: item.thumbnail ?? null,
      fetched_at: fetchedAt,
    });
  }
  return results;
}