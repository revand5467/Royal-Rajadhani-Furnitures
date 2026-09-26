import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/site/ProductDetailView";
import { getRelatedProducts } from "@/lib/catalog";
import { getSiteData } from "@/lib/settings";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};

export default async function PreviewProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: [{ isCover: "desc" }, { position: "asc" }] },
      category: { select: { name: true, slug: true } },
      collection: { select: { name: true, slug: true } },
    },
  });
  if (!product) notFound();

  const [related, site] = await Promise.all([getRelatedProducts(product, 3), getSiteData()]);

  return <ProductDetailView product={product} site={site} related={related} preview />;
}
