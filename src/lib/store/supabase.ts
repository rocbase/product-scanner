import { randomUUID } from "crypto";
import type {
  Listing,
  MarketplacePost,
  PriceResult,
  ProductIdentification,
  Scan,
  ScanStatus,
} from "@/types";
import { DEFAULT_SETTINGS, type UserSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import { saveScanPhotos, toAbsoluteUrl } from "@/lib/storage/photos";

export const DEMO_USER_ID = "supabase-user";

async function getUserId(): Promise<string> {
  const supabase = await createClient();
  if (!supabase) return DEMO_USER_ID;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? DEMO_USER_ID;
}

async function uploadPhotos(
  scanId: string,
  photos: string[]
): Promise<string[]> {
  const supabase = await createClient();
  if (!supabase) return saveScanPhotos(scanId, photos);

  const urls: string[] = [];
  for (let i = 0; i < Math.min(photos.length, 3); i++) {
    const dataUrl = photos[i];
    const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) continue;
    const ext = match[1] === "jpeg" ? "jpg" : match[1];
    const path = `${scanId}/${i}.${ext}`;
    const buffer = Buffer.from(match[2], "base64");
    const { error } = await supabase.storage
      .from("scan-photos")
      .upload(path, buffer, { contentType: `image/${match[1]}`, upsert: true });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from("scan-photos").getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

function rowToScan(row: Record<string, unknown>): Scan {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    status: row.status as ScanStatus,
    photos: (row.photos as string[]) ?? [],
    ai_result: row.ai_result as Scan["ai_result"],
    user_edits: row.user_edits as Scan["user_edits"],
    cost_cents: row.cost_cents as number | null,
    notes: row.notes as string | null,
    bookmarked: Boolean(row.bookmarked),
    created_at: row.created_at as string,
  };
}

export async function createScan(photos: string[]): Promise<Scan> {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const userId = await getUserId();
  const id = randomUUID();
  const storedPhotos = photos[0]?.startsWith("data:")
    ? await uploadPhotos(id, photos)
    : photos;

  const { data, error } = await supabase
    .from("scans")
    .insert({
      id,
      user_id: userId,
      status: "pending",
      photos: storedPhotos,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToScan(data);
}

export async function getScan(id: string): Promise<Scan | undefined> {
  const supabase = await createClient();
  if (!supabase) return undefined;
  const { data } = await supabase.from("scans").select("*").eq("id", id).single();
  return data ? rowToScan(data) : undefined;
}

export async function listScans(): Promise<Scan[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("scans")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map(rowToScan);
}

export async function updateScan(
  id: string,
  patch: Partial<Scan>
): Promise<Scan | undefined> {
  const supabase = await createClient();
  if (!supabase) return undefined;
  const { data, error } = await supabase
    .from("scans")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) return undefined;
  return rowToScan(data);
}

export async function deleteScan(id: string): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return false;
  const { error } = await supabase.from("scans").delete().eq("id", id);
  return !error;
}

export async function saveIdentification(
  scanId: string,
  ai_result: ProductIdentification
): Promise<Scan | undefined> {
  return updateScan(scanId, { ai_result, status: "identified" });
}

export async function savePriceResults(
  scanId: string,
  results: Omit<PriceResult, "id" | "scan_id" | "fetched_at">[]
): Promise<PriceResult[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  await supabase.from("price_results").delete().eq("scan_id", scanId);
  const fetchedAt = new Date().toISOString();
  const rows = results.map((r) => ({
    id: randomUUID(),
    scan_id: scanId,
    ...r,
    fetched_at: fetchedAt,
  }));

  const { data, error } = await supabase
    .from("price_results")
    .insert(rows)
    .select();

  if (error) throw new Error(error.message);
  await updateScan(scanId, { status: "priced" });
  return (data ?? []) as PriceResult[];
}

export async function getPriceResults(scanId: string): Promise<PriceResult[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("price_results")
    .select("*")
    .eq("scan_id", scanId)
    .order("price_cents", { ascending: true });
  return (data ?? []) as PriceResult[];
}

export async function saveListing(
  scanId: string,
  data: Omit<Listing, "id" | "scan_id" | "user_id" | "created_at" | "updated_at">
): Promise<Listing> {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const userId = await getUserId();
  const existing = await getListingByScan(scanId);
  const now = new Date().toISOString();

  if (existing) {
    const { data: updated, error } = await supabase
      .from("listings")
      .update({ ...data, updated_at: now })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await updateScan(scanId, { status: "listing" });
    return updated as Listing;
  }

  const { data: created, error } = await supabase
    .from("listings")
    .insert({
      id: randomUUID(),
      scan_id: scanId,
      user_id: userId,
      created_at: now,
      updated_at: now,
      ...data,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  await updateScan(scanId, { status: "listing" });
  return created as Listing;
}

export async function getListingByScan(
  scanId: string
): Promise<Listing | undefined> {
  const supabase = await createClient();
  if (!supabase) return undefined;
  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("scan_id", scanId)
    .maybeSingle();
  return (data as Listing) ?? undefined;
}

export async function saveMarketplacePost(
  listingId: string,
  data: Omit<MarketplacePost, "id" | "listing_id">
): Promise<MarketplacePost> {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: created, error } = await supabase
    .from("marketplace_posts")
    .insert({ id: randomUUID(), listing_id: listingId, ...data })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return created as MarketplacePost;
}

export async function getPostsForListing(
  listingId: string
): Promise<MarketplacePost[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("marketplace_posts")
    .select("*")
    .eq("listing_id", listingId)
    .order("posted_at", { ascending: false });
  return (data ?? []) as MarketplacePost[];
}

export async function getEbayTokens() {
  const supabase = await createClient();
  if (!supabase) return null;
  const userId = await getUserId();
  const { data } = await supabase
    .from("marketplace_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("marketplace", "ebay")
    .maybeSingle();
  if (!data) return null;
  return {
    access_token: data.access_token as string,
    refresh_token: data.refresh_token as string,
    expires_at: data.expires_at as string,
    seller_username: data.seller_username as string | undefined,
  };
}

export async function saveEbayTokens(
  tokens: {
    access_token: string;
    refresh_token: string;
    expires_at: string;
    seller_username?: string;
  } | undefined
) {
  const supabase = await createClient();
  if (!supabase || !tokens) return;
  const userId = await getUserId();
  await supabase.from("marketplace_accounts").upsert({
    user_id: userId,
    marketplace: "ebay",
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expires_at,
    seller_username: tokens.seller_username,
    connected_at: new Date().toISOString(),
  });
}

export async function clearEbayTokens() {
  const supabase = await createClient();
  if (!supabase) return;
  const userId = await getUserId();
  await supabase
    .from("marketplace_accounts")
    .delete()
    .eq("user_id", userId)
    .eq("marketplace", "ebay");
}

export async function getUserSettings(): Promise<UserSettings> {
  return DEFAULT_SETTINGS;
}

export async function saveUserSettings(
  settings: UserSettings
): Promise<UserSettings> {
  return settings;
}

export { toAbsoluteUrl };