"use client";

import { useRef } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { AVAILABILITY, AVAILABILITY_SHORT, SORT_LABELS, SORT_OPTIONS, type Availability, type SortOption } from "@/lib/constants";
import type { Facets } from "@/lib/catalog";
import { cn } from "@/lib/cn";

export type CatalogControlValues = {
  q: string;
  category: string;
  collection: string;
  availability: string;
  minPrice: string;
  maxPrice: string;
  sort: SortOption;
};

/**
 * Plain GET form — works without JavaScript, and with it we submit
 * automatically as soon as a filter changes. The catalog page reads the same
 * query string on the server, so results stay shareable and back-button safe.
 */
export function CatalogControls({
  values,
  facets,
  resultCount,
}: {
  values: CatalogControlValues;
  facets: Facets;
  resultCount: number;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const submit = () => formRef.current?.requestSubmit();

  const activeCount = [
    values.q,
    values.category,
    values.collection,
    values.availability,
    values.minPrice,
    values.maxPrice,
  ].filter(Boolean).length;

  const pricePlaceholder = facets.priceBounds
    ? `${Math.round(facets.priceBounds.min / 100)}–${Math.round(facets.priceBounds.max / 100)}`
    : "Any";

  return (
    <form
      ref={formRef}
      action="/collection"
      method="get"
      role="search"
      aria-label="Filter the collection"
      className="border-y border-sand-200 py-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="w-full lg:max-w-sm">
          <label htmlFor="catalog-q" className="field-label">
            Search
          </label>
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-500" strokeWidth={1.75} />
            <input
              id="catalog-q"
              name="q"
              type="search"
              defaultValue={values.q}
              placeholder="Search by name, material or description"
              className="field-input pl-9"
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 sm:flex-row lg:w-auto lg:justify-end">
          <div className="sm:w-52">
            <label htmlFor="catalog-sort" className="field-label">
              Sort by
            </label>
            <select
              id="catalog-sort"
              name="sort"
              defaultValue={values.sort}
              onChange={submit}
              className="field-input cursor-pointer"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {SORT_LABELS[option]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-3">
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </div>
        </div>
      </div>

      <details className="group mt-5" open={activeCount > 0}>
        <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-sm text-ink-700 hover:text-ink-950">
          <SlidersHorizontal aria-hidden className="size-4" strokeWidth={1.75} />
          Filters
          {activeCount > 0 ? <span className="text-ink-500">({activeCount} active)</span> : null}
        </summary>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="catalog-category" className="field-label">
              Category
            </label>
            <select
              id="catalog-category"
              name="category"
              defaultValue={values.category}
              onChange={submit}
              className="field-input cursor-pointer"
            >
              <option value="">All categories</option>
              {facets.categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
          </div>

          {facets.collections.length ? (
            <div>
              <label htmlFor="catalog-collection" className="field-label">
                Collection
              </label>
              <select
                id="catalog-collection"
                name="collection"
                defaultValue={values.collection}
                onChange={submit}
                className="field-input cursor-pointer"
              >
                <option value="">All collections</option>
                {facets.collections.map((collection) => (
                  <option key={collection.slug} value={collection.slug}>
                    {collection.name} ({collection.count})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label htmlFor="catalog-availability" className="field-label">
              Availability
            </label>
            <select
              id="catalog-availability"
              name="availability"
              defaultValue={values.availability}
              onChange={submit}
              className="field-input cursor-pointer"
            >
              <option value="">Any availability</option>
              {AVAILABILITY.map((value) => (
                <option key={value} value={value}>
                  {AVAILABILITY_SHORT[value as Availability]}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="sm:col-span-2">
            <legend className="field-label">Price range</legend>
            <div className="flex items-center gap-2">
              <input
                id="catalog-minPrice"
                name="minPrice"
                type="number"
                min="0"
                inputMode="numeric"
                defaultValue={values.minPrice}
                placeholder={pricePlaceholder}
                aria-label="Minimum price"
                className="field-input"
              />
              <span aria-hidden className="text-ink-500">
                –
              </span>
              <input
                id="catalog-maxPrice"
                name="maxPrice"
                type="number"
                min="0"
                inputMode="numeric"
                defaultValue={values.maxPrice}
                placeholder="Any"
                aria-label="Maximum price"
                className="field-input"
              />
            </div>
            <p className="field-hint">
              {facets.priceBounds
                ? `Pieces run from ${Math.round(facets.priceBounds.min / 100)} to ${Math.round(
                    facets.priceBounds.max / 100,
                  )} (whole units).`
                : "Enter whole numbers."}
            </p>
          </fieldset>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button type="submit" className="btn btn-secondary">
            Apply filters
          </button>
          {activeCount > 0 ? (
            <a href="/collection" className="inline-flex items-center gap-1.5 text-sm text-ink-700 underline underline-offset-4 hover:text-clay-700">
              <X aria-hidden className="size-3.5" />
              Clear all
            </a>
          ) : null}
          <p className={cn("text-sm text-ink-500", activeCount > 0 && "lg:ml-auto")} role="status">
            {resultCount === 1 ? "1 piece" : `${resultCount} pieces`} match
          </p>
        </div>
      </details>
    </form>
  );
}
