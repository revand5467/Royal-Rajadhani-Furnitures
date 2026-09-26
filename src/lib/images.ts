const configured = (process.env.IMAGE_REMOTE_HOSTS ?? "")
  .split(",")
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

function supabaseOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).origin.toLowerCase();
  } catch {
    return null;
  }
}

const SUPABASE_ORIGIN = supabaseOrigin();
const SUPABASE_PUBLIC_PREFIX = SUPABASE_ORIGIN ? `${SUPABASE_ORIGIN}/storage/v1/object/public/` : null;

/**
 * True when the Next.js image optimiser is allowed to handle this URL.
 * Same-origin paths always qualify; remote URLs must be on an allow-listed
 * host (IMAGE_REMOTE_HOSTS) or on the configured Supabase storage host.
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
    if (SUPABASE_ORIGIN && parsed.origin.toLowerCase() === SUPABASE_ORIGIN) return true;
    if (configured.includes("*")) return true;
    return configured.includes(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

/** True for images this app stored itself (local uploads or the Supabase bucket). */
export function isStoredUpload(url: string): boolean {
  if (url.startsWith("/media/")) return true;
  return Boolean(SUPABASE_PUBLIC_PREFIX && url.toLowerCase().startsWith(SUPABASE_PUBLIC_PREFIX));
}
