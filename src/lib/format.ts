export function formatPrice(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(0)}%`;
}

export function computeMargin(
  sellCents: number,
  costCents: number | null
): number | null {
  if (costCents == null || costCents === 0) return null;
  return ((sellCents - costCents) / costCents) * 100;
}

export function summarizePrices(prices: number[]): {
  median: number | null;
  low: number | null;
  high: number | null;
  count: number;
} {
  if (!prices.length) {
    return { median: null, low: null, high: null, count: 0 };
  }
  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
      : sorted[mid];
  return {
    median,
    low: sorted[0],
    high: sorted[sorted.length - 1],
    count: sorted.length,
  };
}