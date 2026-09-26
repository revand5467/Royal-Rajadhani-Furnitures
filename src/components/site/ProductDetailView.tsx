import Link from "next/link";
import { ChevronRight, Package, Ruler, Sparkles } from "lucide-react";
import { ProductGallery } from "@/components/site/ProductGallery";
import { ProductCard } from "@/components/site/ProductCard";
import { InquiryForm } from "@/components/site/InquiryForm";
import { AvailabilityBadge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import type { CatalogProduct } from "@/lib/catalog";
import type { StoreSettings } from "@/lib/settings";
import { formatDimensions, formatPrice } from "@/lib/format";
import { discountPercentLabel, effectivePriceCents, hasDiscount, savingsLabel } from "@/lib/pricing";
import { AVAILABILITY_LABELS, type Availability } from "@/lib/constants";

export type DetailProduct = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  description: string;
  priceCents: number;
  discountType?: string | null;
  discountPercent?: number | null;
  discountValueCents?: number | null;
  currency: string;
  materials: string;
  finish: string | null;
  widthCm: number | null;
  depthCm: number | null;
  heightCm: number | null;
  dimensionNote: string | null;
  careInstructions: string | null;
  availability: string;
  sku: string;
  images: Array<{ id: string; url: string; alt: string; credit: string | null }>;
  category: { name: string; slug: string };
  collection: { name: string; slug: string } | null;
};

/**
 * Shared by /furniture/[slug] and the admin preview so a draft can be reviewed
 * exactly as a customer would see it.
 */
export function ProductDetailView({
  product,
  site,
  related,
  preview = false,
}: {
  product: DetailProduct;
  site: { settings: StoreSettings };
  related: CatalogProduct[];
  preview?: boolean;
}) {
  const discounted = hasDiscount(product);
  const sellingPrice = effectivePriceCents(product);
  const percentLabel = discountPercentLabel(product);
  const saved = savingsLabel(product);

  const dimensionText = formatDimensions({
    widthCm: product.widthCm,
    depthCm: product.depthCm,
    heightCm: product.heightCm,
    dimensionNote: product.dimensionNote,
  });

  const specs: Array<{ term: string; value: string }> = [{ term: "Category", value: product.category.name }];
  if (product.collection) specs.push({ term: "Collection", value: product.collection.name });
  specs.push({ term: "Materials", value: product.materials });
  if (product.finish) specs.push({ term: "Colour / finish", value: product.finish });
  if (dimensionText) specs.push({ term: "Dimensions", value: dimensionText });
  specs.push({ term: "Reference", value: product.sku });

  return (
    <div className="container-page py-10 lg:py-14">
      {preview ? (
        <Alert tone="warning" className="mb-8" title="Preview">
          This is how the piece appears to customers.{" "}
          <Link href={`/admin/furniture/${product.id}`} className="underline underline-offset-4">
            Back to editing
          </Link>
          .
        </Alert>
      ) : null}

      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-ink-500">
        <Link href="/" className="hover:text-ink-800">
          Home
        </Link>
        <ChevronRight aria-hidden className="size-3.5" strokeWidth={1.75} />
        <Link href="/collection" className="hover:text-ink-800">
          Collection
        </Link>
        <ChevronRight aria-hidden className="size-3.5" strokeWidth={1.75} />
        <Link href={`/collection?category=${product.category.slug}`} className="hover:text-ink-800">
          {product.category.name}
        </Link>
        <ChevronRight aria-hidden className="size-3.5" strokeWidth={1.75} />
        <span className="text-ink-800">{product.name}</span>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <ProductGallery
            productName={product.name}
            images={product.images.map((image) => ({ id: image.id, url: image.url, alt: image.alt }))}
          />
          {product.images.some((image) => image.credit) ? (
            <p className="mt-3 text-xs text-ink-500">
              Photography credits: {product.images.map((image) => image.credit).filter(Boolean).join(", ")}.
            </p>
          ) : null}
        </div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <AvailabilityBadge value={product.availability} />
            <h1 className="mt-4 font-display text-3xl text-ink-950 sm:text-4xl">{product.name}</h1>
            {discounted ? (
              <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-2xl font-medium tabular-nums text-clay-700">
                  {formatPrice(sellingPrice, product.currency)}
                </p>
                <p className="text-base tabular-nums text-ink-500 line-through">
                  {formatPrice(product.priceCents, product.currency)}
                </p>
                {percentLabel ? (
                  <span className="bg-clay-100 px-2 py-1 text-[0.6875rem] tracking-[0.1em] text-clay-700 uppercase">
                    {percentLabel}
                  </span>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-2xl tabular-nums text-ink-900">
                {formatPrice(product.priceCents, product.currency)}
              </p>
            )}
            <p className="mt-1 text-sm text-ink-500">
              {AVAILABILITY_LABELS[product.availability as Availability] ?? product.availability}
            </p>
            {saved ? <p className="mt-1 text-sm font-medium text-clay-700">{saved}</p> : null}

            <p className="mt-6 text-base leading-relaxed text-ink-700">{product.summary}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#ask" className="btn btn-primary">
                Ask about this piece
              </a>
              <Link href="/contact" className="btn btn-secondary">
                Plan a showroom visit
              </Link>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-ink-500">
              This piece is sold through the showroom — there is no online checkout. Prices include VAT where
              applicable; delivery and finishing options are quoted on request.
            </p>

            <dl className="mt-10 divide-y divide-sand-200 border-t border-sand-200">
              {specs.map((spec) => (
                <div key={spec.term} className="grid grid-cols-3 gap-4 py-3.5">
                  <dt className="text-sm text-ink-500">{spec.term}</dt>
                  <dd className="col-span-2 text-sm text-ink-800">{spec.value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-6 flex flex-wrap gap-4 text-xs text-ink-500">
              <span className="flex items-center gap-1.5">
                <Sparkles aria-hidden className="size-3.5" strokeWidth={1.75} />
                Made to order where needed
              </span>
              <span className="flex items-center gap-1.5">
                <Ruler aria-hidden className="size-3.5" strokeWidth={1.75} />
                Custom sizes on request
              </span>
              <span className="flex items-center gap-1.5">
                <Package aria-hidden className="size-3.5" strokeWidth={1.75} />
                Delivery arranged with the studio
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-16 grid gap-12 border-t border-sand-200 pt-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <h2 className="font-display text-2xl text-ink-950">About this piece</h2>
          <div className="prose-editorial mt-6 space-y-4 text-base leading-relaxed text-ink-700">
            {product.description.split("\n").filter(Boolean).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
        {product.careInstructions ? (
          <div className="lg:col-span-5">
            <h2 className="font-display text-2xl text-ink-950">Care &amp; keeping</h2>
            <div className="prose-editorial mt-6 space-y-4 text-base leading-relaxed text-ink-700">
              {product.careInstructions.split("\n").filter(Boolean).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <section id="ask" className="mt-16 scroll-mt-28 border-t border-sand-200 pt-14" aria-labelledby="ask-heading">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="eyebrow">Inquiry</p>
            <h2 id="ask-heading" className="mt-3 font-display text-3xl text-ink-950">
              Ask about the {product.name}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-600">
              Send us a note and a maker will reply — usually with photographs of the piece in the showroom, lead times
              and finishing options.
            </p>
            <p className="mt-4 text-sm text-ink-600">
              Or call{" "}
              <a href={`tel:${site.settings.phone.replace(/[^+\d]/g, "")}`} className="underline underline-offset-4">
                {site.settings.phone}
              </a>
              {site.settings.email ? (
                <>
                  {" "}
                  or email{" "}
                  <a href={`mailto:${site.settings.email}`} className="underline underline-offset-4">
                    {site.settings.email}
                  </a>
                </>
              ) : null}
              .
            </p>
          </div>

          <div className="lg:col-span-7">
            <InquiryForm
              productId={product.id}
              productName={product.name}
              sourcePath={`/furniture/${product.slug}`}
              storeEmail={site.settings.email}
              storePhone={site.settings.phone}
            />
          </div>
        </div>
      </section>

      {related.length ? (
        <section className="mt-20 border-t border-sand-200 pt-14" aria-labelledby="related-heading">
          <h2 id="related-heading" className="font-display text-2xl text-ink-950">
            You may also like
          </h2>
          <ul className="mt-8 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
