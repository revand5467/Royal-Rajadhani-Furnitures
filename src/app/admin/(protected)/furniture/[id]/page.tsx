import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Eye } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { ImageManager } from "@/components/admin/ImageManager";
import { ProductForm } from "@/components/admin/ProductForm";
import { Alert } from "@/components/ui/Alert";
import { StatusBadge } from "@/components/ui/Badge";
import { prisma } from "@/lib/db";
import { deleteProduct, setProductStatus, toggleProductFeatured } from "@/server/actions/products";
import { formatDateTime } from "@/lib/format";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { name: true } });
  return { title: product ? `Edit — ${product.name}` : "Listing" };
}

export default async function EditProductPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { created } = await searchParams;

  const [product, categories, collections] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: [{ position: "asc" }] } },
    }),
    prisma.category.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
    prisma.collection.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);

  if (!product) notFound();

  const cover = product.images.find((image) => image.isCover) ?? product.images[0] ?? null;

  return (
    <>
      <AdminPageHeader
        eyebrow="Listing"
        title={product.name}
        description={`Created ${formatDateTime(product.createdAt)} · last updated ${formatDateTime(product.updatedAt)}`}
        actions={
          <>
            <Link href={`/admin/furniture/${product.id}/preview`} className="btn btn-secondary">
              <Eye aria-hidden className="size-4" strokeWidth={1.75} />
              Preview
            </Link>
            {product.status === "PUBLISHED" ? (
              <Link href={`/furniture/${product.slug}`} target="_blank" className="btn btn-quiet">
                Live page
                <ExternalLink aria-hidden className="size-3.5" strokeWidth={1.75} />
                <span className="sr-only">(opens in a new tab)</span>
              </Link>
            ) : null}
          </>
        }
      />

      {created ? (
        <Alert tone="success" className="mb-8" title="Listing created">
          Add photography below, then publish when it is ready. This piece is currently{" "}
          <StatusBadge value={product.status} />.
        </Alert>
      ) : null}

      <div className="mb-8 flex flex-wrap items-center gap-3 border border-sand-200 bg-white p-4">
        <StatusBadge value={product.status} />
        {product.featured ? (
          <span className="bg-clay-100 px-2 py-1 text-[0.6875rem] tracking-[0.1em] text-clay-700 uppercase">Featured</span>
        ) : null}
        <span className="text-xs text-ink-500">
          /furniture/{product.slug} · {product.sku}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          <form action={setProductStatus}>
            <input type="hidden" name="id" value={product.id} />
            <input type="hidden" name="status" value={product.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"} />
            <button type="submit" className="btn btn-secondary">
              {product.status === "PUBLISHED" ? "Unpublish" : "Publish"}
            </button>
          </form>

          <form action={toggleProductFeatured}>
            <input type="hidden" name="id" value={product.id} />
            <button type="submit" className="btn btn-quiet">
              {product.featured ? "Remove from featured" : "Feature on homepage"}
            </button>
          </form>

          <form action={deleteProduct}>
            <input type="hidden" name="id" value={product.id} />
            <ConfirmSubmit question={`Permanently delete “${product.name}” and its images?`} confirmLabel="Delete listing">
              Delete listing
            </ConfirmSubmit>
          </form>
        </div>
      </div>

      <div className="space-y-10">
        <ProductForm
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            summary: product.summary,
            description: product.description,
            priceCents: product.priceCents,
            discountType: product.discountType,
            discountPercent: product.discountPercent,
            discountValueCents: product.discountValueCents,
            currency: product.currency,
            categoryId: product.categoryId,
            collectionId: product.collectionId,
            materials: product.materials,
            finish: product.finish,
            widthCm: product.widthCm,
            depthCm: product.depthCm,
            heightCm: product.heightCm,
            dimensionNote: product.dimensionNote,
            careInstructions: product.careInstructions,
            availability: product.availability,
            sku: product.sku,
            featured: product.featured,
            status: product.status,
          }}
          categories={categories}
          collections={collections}
          coverImage={cover ? { url: cover.url, alt: cover.alt } : null}
        />

        <ImageManager
          productId={product.id}
          images={product.images.map((image) => ({
            id: image.id,
            url: image.url,
            alt: image.alt,
            credit: image.credit,
            width: image.width,
            height: image.height,
            isCover: image.isCover,
          }))}
        />
      </div>
    </>
  );
}
