import { randomUUID } from "crypto";
import type {
  Listing,
  MarketplacePost,
  PriceResult,
  ProductIdentification,
  Scan,
} from "@/types";
import { DEFAULT_SETTINGS, type UserSettings } from "@/lib/settings";
import { saveScanPhotos } from "@/lib/storage/photos";
import { loadStore, saveStore, type PersistedStore } from "./persist";

function getStore(): PersistedStore {
  return loadStore();
}

function commit(store: PersistedStore): void {
  saveStore(store);
}

export const DEMO_USER_ID = "demo-user";

export async function createScan(photos: string[]): Promise<Scan> {
  const store = getStore();
  const id = randomUUID();
  const storedPhotos = photos[0]?.startsWith("data:")
    ? saveScanPhotos(id, photos)
    : photos;

  const scan: Scan = {
    id,
    user_id: DEMO_USER_ID,
    status: "pending",
    photos: storedPhotos,
    ai_result: null,
    user_edits: null,
    cost_cents: null,
    notes: null,
    bookmarked: false,
    created_at: new Date().toISOString(),
  };
  store.scans.unshift(scan);
  commit(store);
  return scan;
}

export async function getScan(id: string): Promise<Scan | undefined> {
  return getStore().scans.find((s) => s.id === id);
}

export async function listScans(): Promise<Scan[]> {
  return [...getStore().scans];
}

export async function updateScan(
  id: string,
  patch: Partial<Scan>
): Promise<Scan | undefined> {
  const store = getStore();
  const index = store.scans.findIndex((s) => s.id === id);
  if (index === -1) return undefined;
  store.scans[index] = { ...store.scans[index], ...patch };
  commit(store);
  return store.scans[index];
}

export async function deleteScan(id: string): Promise<boolean> {
  const store = getStore();
  const before = store.scans.length;
  store.scans = store.scans.filter((s) => s.id !== id);
  store.price_results = store.price_results.filter((p) => p.scan_id !== id);
  store.listings = store.listings.filter((l) => l.scan_id !== id);
  if (store.scans.length < before) {
    commit(store);
    return true;
  }
  return false;
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
  const store = getStore();
  store.price_results = store.price_results.filter((p) => p.scan_id !== scanId);
  const saved = results.map((r) => ({
    ...r,
    id: randomUUID(),
    scan_id: scanId,
    fetched_at: new Date().toISOString(),
  }));
  store.price_results.push(...saved);
  await updateScan(scanId, { status: "priced" });
  commit(store);
  return saved;
}

export async function getPriceResults(scanId: string): Promise<PriceResult[]> {
  return getStore().price_results.filter((p) => p.scan_id === scanId);
}

export async function saveListing(
  scanId: string,
  data: Omit<Listing, "id" | "scan_id" | "user_id" | "created_at" | "updated_at">
): Promise<Listing> {
  const store = getStore();
  const existing = store.listings.find((l) => l.scan_id === scanId);
  const now = new Date().toISOString();
  if (existing) {
    Object.assign(existing, data, { updated_at: now });
    await updateScan(scanId, { status: "listing" });
    commit(store);
    return existing;
  }
  const listing: Listing = {
    id: randomUUID(),
    scan_id: scanId,
    user_id: DEMO_USER_ID,
    created_at: now,
    updated_at: now,
    ...data,
  };
  store.listings.push(listing);
  await updateScan(scanId, { status: "listing" });
  commit(store);
  return listing;
}

export async function getListingByScan(
  scanId: string
): Promise<Listing | undefined> {
  return getStore().listings.find((l) => l.scan_id === scanId);
}

export async function saveMarketplacePost(
  listingId: string,
  data: Omit<MarketplacePost, "id" | "listing_id">
): Promise<MarketplacePost> {
  const store = getStore();
  const post: MarketplacePost = {
    id: randomUUID(),
    listing_id: listingId,
    ...data,
  };
  store.marketplace_posts.push(post);
  commit(store);
  return post;
}

export async function getPostsForListing(
  listingId: string
): Promise<MarketplacePost[]> {
  return getStore().marketplace_posts.filter((p) => p.listing_id === listingId);
}

export async function getEbayTokens() {
  return getStore().ebay_tokens ?? null;
}

export async function saveEbayTokens(
  tokens: PersistedStore["ebay_tokens"]
): Promise<void> {
  const store = getStore();
  store.ebay_tokens = tokens;
  commit(store);
}

export async function clearEbayTokens(): Promise<void> {
  const store = getStore();
  delete store.ebay_tokens;
  commit(store);
}

export async function getUserSettings(): Promise<UserSettings> {
  return getStore().user_settings ?? DEFAULT_SETTINGS;
}

export async function saveUserSettings(
  settings: UserSettings
): Promise<UserSettings> {
  const store = getStore();
  store.user_settings = settings;
  commit(store);
  return settings;
}