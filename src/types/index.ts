export type ScanStatus =
  | "pending"
  | "identified"
  | "priced"
  | "listing"
  | "posted"
  | "failed";

export type ProductIdentification = {
  product_name: string;
  brand: string;
  model: string;
  category: string;
  search_queries: string[];
  confidence: number;
  visible_text: string[];
  condition_guess: string;
};

export type Scan = {
  id: string;
  user_id: string;
  status: ScanStatus;
  photos: string[];
  ai_result: ProductIdentification | null;
  user_edits: Partial<ProductIdentification> | null;
  cost_cents: number | null;
  notes: string | null;
  bookmarked: boolean;
  created_at: string;
};

export type PriceResult = {
  id: string;
  scan_id: string;
  marketplace: "ebay" | "google_shopping" | string;
  title: string;
  price_cents: number;
  currency: string;
  condition: string | null;
  url: string;
  image_url: string | null;
  fetched_at: string;
};

export type ListingDraft = {
  title: string;
  description: string;
  suggested_price_cents: number;
  condition: string;
  ebay_category_hint?: string;
  bullet_points: string[];
  seo_keywords: string[];
};

export type Listing = {
  id: string;
  scan_id: string;
  user_id: string;
  title: string;
  description: string;
  price_cents: number;
  condition: string;
  category: string | null;
  photo_order: string[];
  ai_draft: ListingDraft | null;
  user_edits: Record<string, unknown> | null;
  status: "draft" | "ready" | "posted";
  created_at: string;
  updated_at: string;
};

export type MarketplacePost = {
  id: string;
  listing_id: string;
  marketplace: "ebay" | "facebook" | "mercari" | "other" | string;
  status: "pending" | "posted" | "failed";
  external_listing_id: string | null;
  external_url: string | null;
  error_message: string | null;
  posted_at: string | null;
};

export type PriceSummary = {
  median: number | null;
  low: number | null;
  high: number | null;
  count: number;
};