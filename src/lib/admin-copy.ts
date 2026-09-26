/**
 * Client-safe constants for the admin UI.
 *
 * `src/lib/storage.ts` pulls in sharp and node:fs, so client components read
 * the upload limits from the environment directly instead of importing it.
 */
export const MAX_UPLOAD_MB_HINT = Math.max(1, Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB ?? 8) || 8);

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif";

export const INQUIRY_FILTERS = [
  { value: "NEW", label: "New" },
  { value: "READ", label: "Read" },
  { value: "RESOLVED", label: "Resolved" },
] as const;
