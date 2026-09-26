import { openStoredImage } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves uploaded product images from the configured storage directory.
 * Filenames are UUIDs, so responses can be cached aggressively.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const file = await openStoredImage(key.join("/"));

  if (!file) {
    return new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(file.stream, {
    headers: {
      "content-type": file.contentType,
      "content-length": String(file.size),
      "last-modified": file.lastModified.toUTCString(),
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
