const configured = (process.env.IMAGE_REMOTE_HOSTS ?? "")
  .split(",")
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

/**
 * True when the Next.js image optimiser is allowed to handle this URL.
 * Anything else falls back to a plain <img> so a pasted URL never produces a
 * hard error — it simply is not optimised.
 */
export function canOptimize(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("/")) return true;
  if (url.startsWith("data:") || url.startsWith("blob:")) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (configured.includes("*")) return true;
    return configured.includes(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

/** Only same-origin uploads can be deleted from storage. */
export function isStoredUpload(url: string): boolean {
  return url.startsWith("/media/");
}
