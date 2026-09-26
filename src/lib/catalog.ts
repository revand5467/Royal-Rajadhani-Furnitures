import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AVAILABILITY, PAGE_SIZE, SORT_OPTIONS, type SortOption } from "@/lib/constants";

export type SearchParamRecord = Record<string, string | string[] | undefined>;

export type CatalogFilters = {
  q: string;
  category: string;
  collection: string;
  availability: string;
  minPrice: number | null;
  maxPrice: number | null;
  sort: SortOption;
  page: number;
};

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function toCents(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

export function parseCatalogParams(params: SearchParamRecord): CatalogFilters {
  const sort = first(params.sort) as SortOption;
  const page = Number.parseInt(first(params.page), 10);
  const availability = first(params.availability);

  return {
    q: first(params.q).slice(0, 120),
    category: first(params.category).slice(0, 80),
    collection: first(params.collection).slice(0, 80),
    availability: (AVAILABILITY as readonly string[]).includes(availability) ? availability : "",
    minPrice: toCents(first(params.minPrice)),
    maxPrice: toCents(first(params.maxPrice)),
    sort: (SORT_OPTIONS as readonly string[]).includes(sort) ? sort : "featured",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

export function hasActiveFilters(filters: CatalogFilters): boolean {
  return Boolean(
    filters.q ||
      filters.category ||
      filters.collection ||
      filters.availability ||
      filters.minPrice !== null ||
      filters.maxPrice !== null ||
      filters.sort !== "featured",
  );
}

function orderBy(sort: SortOption): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ publishedAt: "desc" }, { createdAt: "desc" }];
    case "name":
      return [{ name: "asc" }];
    // Sorting and filtering run against the denormalised selling price so a
    // discounted piece lands where customers expect it to.
    case "price-asc":
      return [{ effectivePriceCents: "asc" }, { name: "asc" }];
    case "price-desc":
      return [{ effectivePriceCents: "desc" }, { name: "asc" }];
    case "featured":
    default:
      return [{ featured: "desc" }, { publishedAt: "desc" }, { name: "asc" }];
  }
}

export const productCardInclude = {
  images: { orderBy: [{ isCover: "desc" }, { position: "asc" }] },
  category: { select: { name: true, slug: true } },
  collection: { select: { name: true, slug: true } },
} satisfies Prisma.ProductInclude;

export type CatalogProduct = Prisma.ProductGetPayload<{ include: typeof productCardInclude }>;

export function coverImage(product: { images: Array<{ url: string; alt: string }> }) {
  return product.images[0] ?? null;
}

export type CatalogResult = {
  items: CatalogProduct[];
  total: number;
  page: number;
  pageCount: number;
  priceBounds: { min: number; max: number } | null;
};

function buildWhere(filters: CatalogFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { status: "PUBLISHED" };

  if (filters.q) {
    // SQLite's LIKE is case-insensitive for ASCII, so no `mode` override here.
    where.OR = [
      { name: { contains: filters.q } },
      { summary: { contains: filters.q } },
      { description: { contains: filters.q } },
      { materials: { contains: filters.q } },
      { sku: { contains: filters.q } },
    ];
  }
  if (filters.category) where.category = { slug: filters.category };
  if (filters.collection) where.collection = { slug: filters.collection };
  if (filters.availability) where.availability = filters.availability;

  if (filters.minPrice !== null || filters.maxPrice !== null) {
    where.effectivePriceCents = {
      ...(filters.minPrice !== null ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice !== null ? { lte: filters.maxPrice } : {}),
    };
  }
  return where;
}

export async function getCatalog(filters: CatalogFilters, pageSize = PAGE_SIZE): Promise<CatalogResult> {
  const where = buildWhere(filters);

  try {
    const [total, items, bounds] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: productCardInclude,
        orderBy: orderBy(filters.sort),
        skip: (filters.page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.aggregate({
        where: { status: "PUBLISHED" },
        _min: { effectivePriceCents: true },
        _max: { effectivePriceCents: true },
      }),
    ]);

    return {
      items,
      total,
      page: filters.page,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
      priceBounds:
        bounds._min.effectivePriceCents !== null && bounds._max.effectivePriceCents !== null
          ? { min: bounds._min.effectivePriceCents, max: bounds._max.effectivePriceCents }
          : null,
    };
  } catch (error) {
    console.error("[catalog] query failed:", error instanceof Error ? error.message : error);
    return { items: [], total: 0, page: 1, pageCount: 1, priceBounds: null };
  }
}

export type Facets = {
  categories: Array<{ id: string; name: string; slug: string; blurb: string | null; count: number }>;
  collections: Array<{ id: string; name: string; slug: string; blurb: string | null; count: number }>;
  priceBounds: { min: number; max: number } | null;
  availabilityCounts: Array<{ value: string; count: number }>;
  totalPublished: number;
};

export async function getFacets(): Promise<Facets> {
  const empty: Facets = {
    categories: [],
    collections: [],
    priceBounds: null,
    availabilityCounts: [],
    totalPublished: 0,
  };

  try {
    const published = { status: "PUBLISHED" as const };
    const [categories, collections, bounds, availabilityGroups, totalPublished] = await Promise.all([
      prisma.category.findMany({
        orderBy: [{ position: "asc" }, { name: "asc" }],
        include: { _count: { select: { products: { where: published } } } },
      }),
      prisma.collection.findMany({
        orderBy: [{ position: "asc" }, { name: "asc" }],
        include: { _count: { select: { products: { where: published } } } },
      }),
      prisma.product.aggregate({
        where: published,
        _min: { effectivePriceCents: true },
        _max: { effectivePriceCents: true },
      }),
      prisma.product.groupBy({ by: ["availability"], where: published, _count: { _all: true } }),
      prisma.product.count({ where: published }),
    ]);

    return {
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        blurb: c.blurb,
        count: c._count.products,
      })),
      collections: collections.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        blurb: c.blurb,
        count: c._count.products,
      })),
      priceBounds:
        bounds._min.effectivePriceCents !== null && bounds._max.effectivePriceCents !== null
          ? { min: bounds._min.effectivePriceCents, max: bounds._max.effectivePriceCents }
          : null,
      availabilityCounts: availabilityGroups.map((g) => ({ value: g.availability, count: g._count._all })),
      totalPublished,
    };
  } catch (error) {
    console.error("[catalog] facets failed:", error instanceof Error ? error.message : error);
    return empty;
  }
}

export async function getFeaturedProducts(limit = 6): Promise<CatalogProduct[]> {
  try {
    const featured = await prisma.product.findMany({
      where: { status: "PUBLISHED", featured: true },
      include: productCardInclude,
      orderBy: [{ publishedAt: "desc" }, { name: "asc" }],
      take: limit,
    });
    if (featured.length >= limit) return featured;

    // Top up with the newest pieces so the homepage is never half-empty.
    const fill = await prisma.product.findMany({
      where: { status: "PUBLISHED", id: { notIn: featured.map((p) => p.id) } },
      include: productCardInclude,
      orderBy: [{ publishedAt: "desc" }, { name: "asc" }],
      take: limit - featured.length,
    });
    return [...featured, ...fill];
  } catch (error) {
    console.error("[catalog] featured failed:", error instanceof Error ? error.message : error);
    return [];
  }
}

export async function getFeaturedCollections(limit = 3) {
  try {
    return await prisma.collection.findMany({
      where: { featured: true },
      orderBy: [{ position: "asc" }, { name: "asc" }],
      take: limit,
      include: {
        _count: { select: { products: { where: { status: "PUBLISHED" } } } },
        products: {
          where: { status: "PUBLISHED" },
          orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
          take: 1,
          include: { images: { orderBy: [{ isCover: "desc" }, { position: "asc" }], take: 1 } },
        },
      },
    });
  } catch (error) {
    console.error("[catalog] collections failed:", error instanceof Error ? error.message : error);
    return [];
  }
}

export async function getPublishedProductBySlug(slug: string) {
  try {
    return await prisma.product.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: {
        images: { orderBy: [{ isCover: "desc" }, { position: "asc" }] },
        category: true,
        collection: true,
      },
    });
  } catch (error) {
    console.error("[catalog] product lookup failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getPublishedProductBySlug>>>;

export async function getRelatedProducts(
  product: { id: string; categoryId: string; collectionId: string | null },
  limit = 3,
): Promise<CatalogProduct[]> {
  try {
    const sameCollection = product.collectionId
      ? await prisma.product.findMany({
          where: { status: "PUBLISHED", id: { not: product.id }, collectionId: product.collectionId },
          include: productCardInclude,
          orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
          take: limit,
        })
      : [];

    if (sameCollection.length >= limit) return sameCollection;

    const fill = await prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        id: { notIn: [product.id, ...sameCollection.map((p) => p.id)] },
        OR: [{ categoryId: product.categoryId }, { featured: true }],
      },
      include: productCardInclude,
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      take: limit - sameCollection.length,
    });

    return [...sameCollection, ...fill];
  } catch (error) {
    console.error("[catalog] related failed:", error instanceof Error ? error.message : error);
    return [];
  }
}

export async function getPublishedSlugs(limit = 500) {
  try {
    return await prisma.product.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
  } catch {
    return [];
  }
}

export function buildCatalogQuery(
  filters: Partial<CatalogFilters> & { page?: number },
  base: Record<string, string> = {},
): string {
  const params = new URLSearchParams(base);
  for (const [key, value] of Object.entries(filters)) {
    if (value === null || value === undefined || value === "") continue;
    params.set(key, String(value));
  }
  // Drop defaults so URLs stay short and shareable.
  if (params.get("sort") === "featured") params.delete("sort");
  if (params.get("page") === "1") params.delete("page");
  const query = params.toString();
  return query ? `?${query}` : "";
}
