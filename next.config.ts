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
    formats: ["image/avif", "image/webp"],
  },
  serverExternalPackages: ["@prisma/client", "bcryptjs", "sharp"],
  experimental: {
    // Uploads are handled by a server action; allow generous body sizes.
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
