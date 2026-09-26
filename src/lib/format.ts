/**
 * Indian-rupee formatting: `₹12,500` (Indian digit grouping) and 0 decimals for
 * whole amounts. Sites that list several currencies can pass a different one,
 * but this shop prices everything in INR.
 */
export function formatPrice(cents: number, currency = "INR"): string {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatPriceInput(cents: number): string {
  return (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
}

export function formatDimensions(input: {
  widthCm?: number | null;
  depthCm?: number | null;
  heightCm?: number | null;
  dimensionNote?: string | null;
}): string {
  const parts: string[] = [];
  if (input.widthCm) parts.push(`W ${input.widthCm}`);
  if (input.depthCm) parts.push(`D ${input.depthCm}`);
  if (input.heightCm) parts.push(`H ${input.heightCm}`);
  const measure = parts.length ? `${parts.join(" × ")} cm` : "";
  return [measure, input.dimensionNote].filter(Boolean).join(" · ");
}

export function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export function formatDateTime(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** "2 days ago" style stamp used in the inquiry inbox. */
export function formatRelative(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" });
  for (const [unit, secondsPerUnit] of units) {
    if (Math.abs(seconds) >= secondsPerUnit) {
      return formatter.format(-Math.round(seconds / secondsPerUnit), unit);
    }
  }
  return "just now";
}

export function formatOpeningRange(opens?: string | null, closes?: string | null, closed?: boolean): string {
  if (closed) return "Closed";
  if (!opens || !closes) return "Closed";
  return `${opens}–${closes}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
