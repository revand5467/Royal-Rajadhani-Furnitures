import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/site/ProductDetailView";
import { getPublishedProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { effectivePriceCents } from "@/lib/pricing";
import { getSiteData } from "@/lib/settings";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);
  if (!product) return { title: "Piece not found" };

  const image = product.images[0];
  const description = product.summary.slice(0, 300);

  return {
    title: product.name,
    description,
    alternates: { canonical: `/furniture/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      type: "website",
      url: `/furniture/${product.slug}`,
      images: image ? [{ url: image.url, alt: image.alt }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: image ? [image.url] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);
  if (!product) notFound();

  const [related, site] = await Promise.all([getRelatedProducts(product, 3), getSiteData()]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.summary,
    sku: product.sku,
    image: product.images.map((image) => image.url),
    material: product.materials,
    category: product.category.name,
    brand: { "@type": "Brand", name: site.settings.storeName },
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency,
      // Search engines should see the price a customer actually pays.
      price: (effectivePriceCents(product) / 100).toFixed(2),
      availability:
        product.availability === "SOLD_OUT"
          ? "https://schema.org/OutOfStock"
          : product.availability === "IN_STOCK"
            ? "https://schema.org/InStock"
            : "https://schema.org/PreOrder",
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/furniture/${product.slug}`,
      // Purchases are arranged with the studio rather than online.
      potentialAction: {
        "@type": "ContactAction",
        target: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/furniture/${product.slug}#ask`,
      },
    },
  };

  return (
    <>
      <ProductDetailView product={product} site={site} related={related} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
