import { createReadStream } from "node:fs";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import { ALLOWED_IMAGE_MIME } from "@/lib/constants";

/**
 * Image storage driver with two interchangeable backends:
 *
 * 1. **Supabase Storage** — active when `NEXT_PUBLIC_SUPABASE_URL` and
 *    `SUPABASE_SERVICE_ROLE_KEY` are both set. Files are uploaded to a public
 *    bucket and served from Supabase's CDN. This is the mode used on Vercel,
 *    where the serverless filesystem is ephemeral.
 *
 * 2. **Local disk** — the zero-config default. Files are normalised to WebP,
 *    capped at 2400px on the long edge and written under `UPLOAD_DIR` (default
 *    `storage/uploads`), then served back through `/media/<key>` so the app
 *    never depends on files inside `public/` (frozen at build time on most
 *    hosts).
 *
 * Everything in the app talks to this module through `storeImage`,
 * `openStoredImage` and `deleteStoredImageByUrl`, so adding another backend
 * (S3/R2/Vercel Blob) means touching only this file.
 */

export const MAX_UPLOAD_MB = Math.max(1, Number(process.env.MAX_UPLOAD_MB ?? 8) || 8);
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "media";

/** "supabase" when both remote credentials are present, otherwise "local". */
export function storageMode(): "supabase" | "local" {
  return SUPABASE_URL && SUPABASE_SERVICE_KEY ? "supabase" : "local";
}

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export function uploadRoot(): string {
  const configured = process.env.UPLOAD_DIR?.trim() || "storage/uploads";
  if (path.isAbsolute(configured)) return configured;
  // turbopackIgnore: the upload directory is runtime configuration, so it must
  // not pull the whole project into the server bundle's file trace.
  return path.join(/* turbopackIgnore: true */ process.cwd(), configured);
}

/** Sniffs the real file type so a renamed .exe cannot masquerade as a JPEG. */
function sniffMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer[0] === 0x89 && buffer.subarray(1, 4).toString("latin1") === "PNG") return "image/png";
  if (buffer.subarray(0, 4).toString("latin1") === "GIF8") return "image/gif";
  if (buffer.subarray(0, 4).toString("latin1") === "RIFF" && buffer.subarray(8, 12).toString("latin1") === "WEBP") {
    return "image/webp";
  }
  // ISO-BMFF container: check the brand for AVIF/HEIC.
  if (buffer.subarray(4, 8).toString("latin1") === "ftyp") {
    const brand = buffer.subarray(8, 12).toString("latin1");
    if (brand.startsWith("avif") || brand.startsWith("avis")) return "image/avif";
  }
  return null;
}

export type StoredImage = {
  url: string;
  key: string;
  width: number;
  height: number;
  bytes: number;
  contentType: string;
  originalName: string;
};

/** Shared validation + WebP normalisation used by both backends. */
async function normaliseUpload(file: File) {
  if (!file || typeof file === "string" || file.size === 0) {
    throw new UploadError("Choose an image file to upload.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError(`That image is larger than ${MAX_UPLOAD_MB} MB. Please resize it and try again.`);
  }

  const input = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffMime(input);
  if (!sniffed || !ALLOWED_IMAGE_MIME.includes(sniffed as (typeof ALLOWED_IMAGE_MIME)[number])) {
    throw new UploadError("Only JPEG, PNG, WebP, AVIF and GIF images are supported.");
  }

  try {
    const result = await sharp(input, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    return result;
  } catch {
    throw new UploadError("That file could not be read as an image.");
  }
}

export async function storeImage(file: File, folder = "products"): Promise<StoredImage> {
  const { data: output, info } = await normaliseUpload(file);
  const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, "").replace(/^\/+|\/+$/g, "") || "products";
  const key = `${safeFolder}/${randomUUID()}.webp`;

  if (supabase) {
    const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(key, output, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) {
      throw new UploadError(`Upload failed: ${error.message}`);
    }
    const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(key);
    return {
      url: data.publicUrl,
      key,
      width: info.width,
      height: info.height,
      bytes: output.byteLength,
      contentType: "image/webp",
      originalName: file.name || "upload",
    };
  }

  const destination = path.join(uploadRoot(), key);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, output);

  return {
    url: `/media/${key}`,
    key,
    width: info.width,
    height: info.height,
    bytes: output.byteLength,
    contentType: "image/webp",
    originalName: file.name || "upload",
  };
}

/** Resolves a `/media/...` key to an absolute path, refusing traversal. */
export function resolveKey(key: string): string | null {
  if (!key) return null;
  const segments = key.split("/").filter(Boolean);
  if (!segments.length) return null;
  for (const segment of segments) {
    if (segment === "." || segment === "..") return null;
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(segment)) return null;
  }
  const root = uploadRoot();
  const resolved = path.resolve(root, ...segments);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  return resolved;
}

export type StoredFile = {
  stream: ReadableStream;
  contentType: string;
  size: number;
  lastModified: Date;
};

/**
 * Streams a locally-stored image. Returns null in Supabase mode — remote files
 * are served by Supabase's CDN and never routed through /media/.
 */
export async function openStoredImage(key: string): Promise<StoredFile | null> {
  if (storageMode() !== "local") return null;
  const resolved = resolveKey(key);
  if (!resolved) return null;
  try {
    // turbopackIgnore: the upload root is runtime configuration (UPLOAD_DIR),
    // not a bundle-time path — tracing the whole project for it is wrong.
    const info = await stat(/* turbopackIgnore: true */ resolved);
    if (!info.isFile()) return null;
    const contentType = CONTENT_TYPES[path.extname(resolved).toLowerCase()] ?? "application/octet-stream";
    const nodeStream = createReadStream(/* turbopackIgnore: true */ resolved);
    return {
      stream: Readable.toWeb(nodeStream) as ReadableStream,
      contentType,
      size: info.size,
      lastModified: info.mtime,
    };
  } catch {
    return null;
  }
}

/** Extracts the bucket key from a Supabase public object URL, or null. */
function supabaseKeyFromUrl(url: string): string | null {
  if (!SUPABASE_URL) return null;
  try {
    const parsed = new URL(url);
    if (parsed.origin !== new URL(SUPABASE_URL).origin) return null;
    const prefix = `/storage/v1/object/public/${SUPABASE_BUCKET}/`;
    if (!parsed.pathname.startsWith(prefix)) return null;
    return decodeURIComponent(parsed.pathname.slice(prefix.length)) || null;
  } catch {
    return null;
  }
}

/** Best-effort cleanup when an admin removes an uploaded image. */
export async function deleteStoredImageByUrl(url: string): Promise<void> {
  if (supabase) {
    const key = supabaseKeyFromUrl(url);
    if (!key) return;
    const { error } = await supabase.storage.from(SUPABASE_BUCKET).remove([key]);
    if (error) console.error("[storage] supabase delete failed:", error.message);
    return;
  }

  if (!url.startsWith("/media/")) return;
  const resolved = resolveKey(url.slice("/media/".length));
  if (!resolved) return;
  try {
    await unlink(resolved);
  } catch {
    // Already gone — nothing to do.
  }
}
