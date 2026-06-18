import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type {
  Listing,
  MarketplacePost,
  PriceResult,
  Scan,
} from "@/types";
import type { UserSettings } from "@/lib/settings";

export type PersistedStore = {
  scans: Scan[];
  price_results: PriceResult[];
  listings: Listing[];
  marketplace_posts: MarketplacePost[];
  ebay_tokens?: {
    access_token: string;
    refresh_token: string;
    expires_at: string;
    seller_username?: string;
  };
  user_settings?: UserSettings;
};

const DATA_DIR = join(process.cwd(), ".data");
const STORE_PATH = join(DATA_DIR, "store.json");

const EMPTY: PersistedStore = {
  scans: [],
  price_results: [],
  listings: [],
  marketplace_posts: [],
};

export function loadStore(): PersistedStore {
  try {
    if (!existsSync(STORE_PATH)) return { ...EMPTY };
    const raw = readFileSync(STORE_PATH, "utf-8");
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY };
  }
}

export function saveStore(store: PersistedStore): void {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}