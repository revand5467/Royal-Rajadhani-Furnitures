import { createReadStream } from "node:fs";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import sharp from "sharp";
import { ALLOWED_IMAGE_MIME } from "@/lib/constants";

/**
 * Local disk storage driver.
 *
 * Uploaded files are normalised to WebP, capped at 2400px on the long edge and
 * written under `UPLOAD_DIR` (default `storage/uploads`). They are served back
 * through `/media/<key>` so the app never depends on files inside `public/`
 * (which is frozen at build time on most hosts).
 *
 * Everything in the app talks to this module through `storeImage`,
 * `openStoredImage` and `deleteStoredImageByUrl`, so replacing the driver with
 * S3/R2/Vercel Blob later means implementing three functions.
 */

export const MAX_UPLOAD_MB = Math.max(1, Number(process.env.MAX_UPLOAD_MB ?? 8) || 8);
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

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

export async function storeImage(file: File, folder = "products"): Promise<StoredImage> {
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

  let output: Buffer;
  let width: number;
  let height: number;
  try {
    const pipeline = sharp(input, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 });
    const result = await pipeline.toBuffer({ resolveWithObject: true });
    output = result.data;
    width = result.info.width;
    height = result.info.height;
  } catch {
    throw new UploadError("That file could not be read as an image.");
  }

  const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, "").replace(/^\/+|\/+$/g, "") || "products";
  const key = `${safeFolder}/${randomUUID()}.webp`;
  const destination = path.join(uploadRoot(), key);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, output);

  return {
    url: `/media/${key}`,
    key,
    width,
    height,
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

export async function openStoredImage(key: string): Promise<StoredFile | null> {
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

/** Best-effort cleanup when an admin removes an uploaded image. */
export async function deleteStoredImageByUrl(url: string): Promise<void> {
  if (!url.startsWith("/media/")) return;
  const resolved = resolveKey(url.slice("/media/".length));
  if (!resolved) return;
  try {
    await unlink(resolved);
  } catch {
    // Already gone — nothing to do.
  }
}
