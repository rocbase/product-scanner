export type UserSettings = {
  default_markup_percent: number;
  preferred_marketplaces: string[];
  listing_footer: string;
};

export const DEFAULT_SETTINGS: UserSettings = {
  default_markup_percent: 30,
  preferred_marketplaces: ["ebay", "facebook", "mercari"],
  listing_footer: "Message me with any questions. Thanks for looking!",
};

const KEY = "product-scanner-settings";
let cache: UserSettings | null = null;

export function loadSettings(): UserSettings {
  if (cache) return cache;
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as UserSettings;
    cache = parsed;
    return parsed;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(patch: Partial<UserSettings>): UserSettings {
  const next = { ...loadSettings(), ...patch };
  cache = next;
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(next));
    fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => {});
  }
  return next;
}

export async function hydrateSettings(): Promise<UserSettings> {
  try {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const { settings } = await res.json();
      cache = { ...DEFAULT_SETTINGS, ...settings };
      if (typeof window !== "undefined") {
        localStorage.setItem(KEY, JSON.stringify(cache));
      }
      return cache as UserSettings;
    }
  } catch {
    // Fall back to local
  }
  return loadSettings();
}