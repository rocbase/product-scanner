import type { PriceResult } from "@/types";

type EbayTokenResponse = {
  access_token: string;
  expires_in: number;
};

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getEbayToken(): Promise<string> {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("eBay API credentials are not configured");
  }

  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );
  const scope = "https://api.ebay.com/oauth/api_scope";
  const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope,
    }),
  });

  if (!res.ok) {
    throw new Error(`eBay auth failed: ${res.status}`);
  }

  const data = (await res.json()) as EbayTokenResponse;
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - 60_000,
  };
  return data.access_token;
}

export async function searchEbay(query: string): Promise<PriceResult[]> {
  const token = await getEbayToken();
  const params = new URLSearchParams({
    q: query,
    limit: "12",
    filter: "buyingOptions:{FIXED_PRICE}",
    sort: "price",
  });

  const res = await fetch(
    `https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`eBay search failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    itemSummaries?: Array<{
      itemId: string;
      title: string;
      price?: { value: string; currency: string };
      condition?: string;
      itemWebUrl: string;
      image?: { imageUrl: string };
    }>;
  };

  const fetchedAt = new Date().toISOString();
  return (data.itemSummaries ?? [])
    .filter((item) => item.price?.value)
    .map((item) => ({
      id: "",
      scan_id: "",
      marketplace: "ebay" as const,
      title: item.title,
      price_cents: Math.round(parseFloat(item.price!.value) * 100),
      currency: item.price!.currency || "USD",
      condition: item.condition ?? null,
      url: item.itemWebUrl,
      image_url: item.image?.imageUrl ?? null,
      fetched_at: fetchedAt,
    }));
}