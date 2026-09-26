import type { NextConfig } from "next";

/**
 * Remote image hosts allowed through the Next.js image optimiser.
 *
 * The seed catalog ships local files under `public/samples`, so an empty
 * value is fine for a fresh install. Set `IMAGE_REMOTE_HOSTS` when admins are
 * expected to paste external image URLs (for example Unsplash or a CDN), or
 * to `*` to allow any https host.
 */
const remoteHosts = (process.env.IMAGE_REMOTE_HOSTS ?? "images.unsplash.com,cdn.stocksnap.io,upload.wikimedia.org,images.pexels.com,cdn.pixabay.com")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: remoteHosts.map((hostname) => ({ protocol: "https" as const, hostname })),
    // AVIF first (browsers that support it get ~28% fewer bytes than WebP on
    // this photography, which matters most on mobile connections), falling
    // back to WebP everywhere else. The more expensive AVIF encode is paid
    // once per size and then cached — see minimumCacheTTL below.
    formats: ["image/avif", "image/webp"],
    // Uploaded files always get a fresh UUID filename, so an optimised variant
    // never changes under a given URL. Cache variants at the edge for 30 days
    // instead of the 60-second default, which otherwise re-encodes on every
    // visit and keeps the optimiser cold.
    minimumCacheTTL: 2592000,
  },
  serverExternalPackages: ["@prisma/client", "bcryptjs", "sharp"],
  experimental: {
    // Uploads are handled by a server action; allow generous body sizes.
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
