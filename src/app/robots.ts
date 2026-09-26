import type { MetadataRoute } from "next";

const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The management area is never indexable.
        disallow: ["/admin", "/admin/", "/media/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
