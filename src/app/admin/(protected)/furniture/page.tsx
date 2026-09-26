import type { Metadata } from "next";
import Link from "next/link";
import { Edit3, Eye, Plus, Search } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
import { Pagination } from "@/components/site/Pagination";
import { Media } from "@/components/ui/Media";
import { prisma } from "@/lib/db";
import { deleteProduct, setProductStatus, toggleProductFeatured } from "@/server/actions/products";
import { formatPrice, formatRelative } from "@/lib/format";
import { effectivePriceCents, hasDiscount, savingsLabel } from "@/lib/pricing";
import { ADMIN_PAGE_SIZE, PRODUCT_STATUS } from "@/lib/constants";

export const metadata: Metadata = { title: "Listings" };

type PageProps = {
  searchParams: Promise<{ q?: string; status?: string; category?: string; page?: string; deleted?: string }>;
};

export default async function AdminFurniturePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = (params.q ?? "").slice(0, 120);
  const status = (PRODUCT_STATUS as readonly string[]).includes(params.status ?? "") ? params.status! : "";
  const categoryId = params.category ?? "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where = {
    ...(status ? { status } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { sku: { contains: q } },
            { summary: { contains: q } },
          ],
        }
      : {}),
  };

  const [total, products, categories] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: {
        category: { select: { name: true } },
        images: { orderBy: [{ isCover: "desc" }, { position: "asc" }], take: 1 },
        _count: { select: { images: true, inquiries: true } },
      },
    }),
    prisma.category.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const filtersActive = Boolean(q || status || categoryId);

  return (
    <>
      <AdminPageHeader
        eyebrow="Catalog"
        title="Listings"
        description="Every piece in the catalogue, published or draft. Publish when a listing is complete — customers only see published pieces."
        actions={
          <Link href="/admin/furniture/new" className="btn btn-primary">
            <Plus aria-hidden className="size-4" strokeWidth={1.75} />
            New listing
          </Link>
        }
      />

      {params.deleted ? <Alert tone="success" className="mb-6">The listing and its uploaded images were deleted.</Alert> : null}

      <form action="/admin/furniture" method="get" role="search" aria-label="Filter listings" className="mb-8 border border-sand-200 bg-white p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))_auto] lg:items-end">
          <div>
            <label htmlFor="admin-q" className="field-label">
              Search
            </label>
            <div className="relative">
              <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-500" strokeWidth={1.75} />
              <input
                id="admin-q"
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Name, SKU or summary"
                className="field-input pl-9"
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-status" className="field-label">
              Status
            </label>
            <select id="admin-status" name="status" defaultValue={status} className="field-input cursor-pointer">
              <option value="">All statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>

          <div>
            <label htmlFor="admin-category" className="field-label">
              Category
            </label>
            <select id="admin-category" name="category" defaultValue={categoryId} className="field-input cursor-pointer">
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn btn-secondary">
              Filter
            </button>
            {filtersActive ? (
              <Link href="/admin/furniture" className="btn btn-quiet">
                Reset
              </Link>
            ) : null}
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-500" role="status">
          {total} listing{total === 1 ? "" : "s"} match.
        </p>
      </form>

      {products.length === 0 ? (
        <EmptyState
          title={filtersActive ? "No listings match those filters" : "No listings yet"}
          action={
            filtersActive ? (
              <Link href="/admin/furniture" className="btn btn-secondary">
                Clear filters
              </Link>
            ) : (
              <Link href="/admin/furniture/new" className="btn btn-primary">
                Create the first listing
              </Link>
            )
          }
        >
          {filtersActive ? <p>Try a different search term or reset the filters.</p> : <p>Add a piece to see it in the catalogue.</p>}
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {products.map((product) => {
            const cover = product.images[0];
            const publishable = product._count.images > 0;
            return (
              <li key={product.id} className="border border-sand-200 bg-white p-4">
                <div className="grid gap-4 sm:grid-cols-[6.5rem_minmax(0,1fr)] lg:grid-cols-[6.5rem_minmax(0,1fr)_auto]">
                  <div className="relative aspect-4/3 w-full overflow-hidden bg-sand-200">
                    <Media src={cover?.url} alt={cover?.alt ?? product.name} sizes="110px" />
                    {product._count.images === 0 ? (
                      <span className="absolute inset-0 grid place-items-center bg-sand-100/80 text-center text-[0.625rem] text-ink-600">
                        No image
                      </span>
                    ) : null}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg text-ink-950">
                        <Link href={`/admin/furniture/${product.id}`} className="hover:text-clay-700">
                          {product.name}
                        </Link>
                      </h2>
                      <StatusBadge value={product.status} />
                      {product.featured ? (
                        <span className="bg-clay-100 px-2 py-1 text-[0.6875rem] tracking-[0.1em] text-clay-700 uppercase">
                          Featured
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-1.5 text-sm text-ink-600">
                      {product.category.name} · {product.sku} ·{" "}
                      {hasDiscount(product) ? (
                        <>
                          <span className="text-ink-500 line-through">
                            {formatPrice(product.priceCents, product.currency)}
                          </span>{" "}
                          <span className="font-medium text-clay-700">
                            {formatPrice(effectivePriceCents(product), product.currency)}
                          </span>{" "}
                          <span className="text-xs text-clay-700">({savingsLabel(product)})</span>
                        </>
                      ) : (
                        formatPrice(product.priceCents, product.currency)
                      )}
                    </p>
                    <p className="mt-1 text-xs text-ink-500">
                      {product._count.images} image{product._count.images === 1 ? "" : "s"} ·{" "}
                      {product._count.inquiries} inquir{product._count.inquiries === 1 ? "y" : "ies"} · updated{" "}
                      {formatRelative(product.updatedAt)}
                    </p>
                    {!publishable && product.status === "PUBLISHED" ? (
                      <p className="mt-2 text-xs font-medium text-warning-600">
                        Published without photography — add an image so the card is not blank.
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-start gap-2 sm:col-span-2 lg:col-span-1 lg:justify-end">
                    <Link href={`/admin/furniture/${product.id}`} className="btn btn-quiet">
                      <Edit3 aria-hidden className="size-3.5" strokeWidth={1.75} />
                      Edit
                    </Link>
                    <Link href={`/admin/furniture/${product.id}/preview`} className="btn btn-quiet">
                      <Eye aria-hidden className="size-3.5" strokeWidth={1.75} />
                      Preview
                    </Link>

                    <form action={setProductStatus}>
                      <input type="hidden" name="id" value={product.id} />
                      <input type="hidden" name="status" value={product.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"} />
                      <button type="submit" className="btn btn-quiet">
                        {product.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                      </button>
                    </form>

                    <form action={toggleProductFeatured}>
                      <input type="hidden" name="id" value={product.id} />
                      <button type="submit" className="btn btn-quiet">
                        {product.featured ? "Unfeature" : "Feature"}
                      </button>
                    </form>

                    <form action={deleteProduct}>
                      <input type="hidden" name="id" value={product.id} />
                      <ConfirmSubmit
                        question={`Delete “${product.name}”?`}
                        confirmLabel="Delete permanently"
                      >
                        Delete
                      </ConfirmSubmit>
                    </form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination
        page={page}
        pageCount={pageCount}
        total={total}
        pageSize={ADMIN_PAGE_SIZE}
        params={{ q, status, category: categoryId }}
        basePath="/admin/furniture"
      />
    </>
  );
}
