export const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "used_like_new", label: "Used — Like New" },
  { value: "used_good", label: "Used — Good" },
  { value: "used_fair", label: "Used — Fair" },
  { value: "for_parts", label: "For Parts / Not Working" },
] as const;

export const MARKETPLACE_LINKS = {
  facebook: (query: string) =>
    `https://www.facebook.com/marketplace/create/item?query=${encodeURIComponent(query)}`,
  mercari: (query: string) =>
    `https://www.mercari.com/search/?keyword=${encodeURIComponent(query)}`,
  offerup: (query: string) =>
    `https://offerup.com/search/?q=${encodeURIComponent(query)}`,
  ebay: (query: string) =>
    `https://www.ebay.com/sl/sell?title=${encodeURIComponent(query)}`,
} as const;