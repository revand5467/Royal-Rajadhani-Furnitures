import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CatalogControls } from "@/components/site/CatalogControls";
import { Pagination } from "@/components/site/Pagination";
import { ProductCard } from "@/components/site/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductGridSkeleton } from "@/components/ui/Spinner";
import { getCatalog, getFacets, hasActiveFilters, parseCatalogParams, type SearchParamRecord } from "@/lib/catalog";
import { PAGE_SIZE } from "@/lib/constants";

type PageProps = { searchParams: Promise<SearchParamRecord> };

export const metadata: Metadata = {
  title: "The collection",
  description:
    "Browse every piece in the Rajadhani Furniture collection — sofas, dining tables, seating, storage and lighting, with materials, dimensions and availability for each. Prices are shown in Indian rupees.",
  alternates: { canonical: "/collection" },
};

export default async function CollectionPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = parseCatalogParams(params);

  const [facets, result] = await Promise.all([getFacets(), getCatalog(filters)]);

  const activeCategory = facets.categories.find((c) => c.slug === filters.category);
  const activeCollection = facets.collections.find((c) => c.slug === filters.collection);
  const filtersActive = hasActiveFilters(filters);

  const heading = activeCollection?.name ?? activeCategory?.name ?? "The collection";
  const intro =
    activeCollection?.blurb ??
    activeCategory?.blurb ??
    "Solid teak, mango wood and rosewood furniture for the Indian home. Availability, materials, dimensions and prices are listed on each piece — and we are always happy to answer questions.";

  return (
    <div className="container-page py-12 lg:py-16">
      <header className="max-w-3xl">
        <p className="eyebrow">Furniture</p>
        <h1 className="mt-4 font-display text-4xl text-ink-950 sm:text-5xl">{heading}</h1>
        <p className="mt-5 text-base leading-relaxed text-ink-600">{intro}</p>
      </header>

      <div className="mt-10">
        <CatalogControls
          values={{
            q: filters.q,
            category: filters.category,
            collection: filters.collection,
            availability: filters.availability,
            minPrice: filters.minPrice !== null ? String(Math.round(filters.minPrice / 100)) : "",
            maxPrice: filters.maxPrice !== null ? String(Math.round(filters.maxPrice / 100)) : "",
            sort: filters.sort,
          }}
          facets={facets}
          resultCount={result.total}
        />
      </div>

      <Suspense key={JSON.stringify(params)} fallback={<div className="mt-12"><ProductGridSkeleton /></div>}>
        <section className="mt-12" aria-labelledby="results-heading">
          <h2 id="results-heading" className="sr-only">
            Results
          </h2>

          {result.items.length === 0 ? (
            <EmptyState
              title={filtersActive ? "No pieces match those filters" : "The collection is empty"}
              action={
                filtersActive ? (
                  <Link href="/collection" className="btn btn-secondary">
                    Clear filters
                  </Link>
                ) : (
                  <Link href="/contact" className="btn btn-primary">
                    Ask what is coming
                  </Link>
                )
              }
            >
              {filtersActive ? (
                <p>
                  Try widening the price range or clearing the search term. If you are looking for something specific
                  that is not listed, tell us — much of what we make is bespoke.
                </p>
              ) : (
                <p>Publish a piece from the admin area and it will appear here straight away.</p>
              )}
            </EmptyState>
          ) : (
            <ul className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 3} />
              ))}
            </ul>
          )}
        </section>
      </Suspense>

      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        total={result.total}
        pageSize={PAGE_SIZE}
        params={{
          q: filters.q,
          category: filters.category,
          collection: filters.collection,
          availability: filters.availability,
          minPrice: filters.minPrice !== null ? String(Math.round(filters.minPrice / 100)) : "",
          maxPrice: filters.maxPrice !== null ? String(Math.round(filters.maxPrice / 100)) : "",
          sort: filters.sort === "featured" ? "" : filters.sort,
        }}
      />
    </div>
  );
}
