type EbaySellerTokens = {
  access_token: string;
  refresh_token: string;
  expires_at: string;
};

export type PublishListingInput = {
  title: string;
  description: string;
  price_cents: number;
  condition: string;
  photo_urls: string[];
  tokens: EbaySellerTokens;
};

const CONDITION_MAP: Record<string, string> = {
  new: "NEW",
  used_like_new: "LIKE_NEW",
  used_good: "USED_EXCELLENT",
  used_fair: "USED_ACCEPTABLE",
  for_parts: "FOR_PARTS_OR_NOT_WORKING",
};

export async function publishEbayListing(
  input: PublishListingInput
): Promise<{ listingId: string; url: string }> {
  const sku = `scan-${Date.now()}`;
  const accessToken = input.tokens.access_token;

  const inventoryRes = await fetch(
    "https://api.ebay.com/sell/inventory/v1/inventory_item/" +
      encodeURIComponent(sku),
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Content-Language": "en-US",
      },
      body: JSON.stringify({
        product: {
          title: input.title,
          description: input.description,
          imageUrls: input.photo_urls.slice(0, 12),
        },
        condition: CONDITION_MAP[input.condition] ?? "USED_GOOD",
        availability: { shipToLocationAvailability: { quantity: 1 } },
      }),
    }
  );

  if (!inventoryRes.ok) {
    const err = await inventoryRes.text();
    throw new Error(`eBay inventory failed: ${err}`);
  }

  const offerRes = await fetch(
    "https://api.ebay.com/sell/inventory/v1/offer",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Content-Language": "en-US",
      },
      body: JSON.stringify({
        sku,
        marketplaceId: "EBAY_US",
        format: "FIXED_PRICE",
        pricingSummary: {
          price: {
            value: (input.price_cents / 100).toFixed(2),
            currency: "USD",
          },
        },
        listingDescription: input.description,
        listingPolicies: {
          fulfillmentPolicyId: process.env.EBAY_FULFILLMENT_POLICY_ID,
          paymentPolicyId: process.env.EBAY_PAYMENT_POLICY_ID,
          returnPolicyId: process.env.EBAY_RETURN_POLICY_ID,
        },
        categoryId: process.env.EBAY_DEFAULT_CATEGORY_ID ?? "9355",
      }),
    }
  );

  if (!offerRes.ok) {
    const err = await offerRes.text();
    throw new Error(`eBay offer failed: ${err}`);
  }

  const offer = (await offerRes.json()) as { offerId: string };
  const publishRes = await fetch(
    `https://api.ebay.com/sell/inventory/v1/offer/${offer.offerId}/publish`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!publishRes.ok) {
    const err = await publishRes.text();
    throw new Error(`eBay publish failed: ${err}`);
  }

  const published = (await publishRes.json()) as { listingId: string };
  return {
    listingId: published.listingId,
    url: `https://www.ebay.com/itm/${published.listingId}`,
  };
}