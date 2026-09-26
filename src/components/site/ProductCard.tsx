import Link from "next/link";
import { Media } from "@/components/ui/Media";
import { AvailabilityBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { discountPercentLabel, effectivePriceCents, hasDiscount, savingsLabel } from "@/lib/pricing";
import { coverImage, type CatalogProduct } from "@/lib/catalog";

export function ProductCard({
  product,
  priority = false,
  sizes,
  className,
}: {
  product: CatalogProduct;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  const image = coverImage(product);
  const soldOut = product.availability === "SOLD_OUT";
  const discounted = hasDiscount(product);
  const sellingPrice = effectivePriceCents(product);
  const percentLabel = discountPercentLabel(product);
  const saved = savingsLabel(product);

  return (
    <li className={cn("group relative", className)}>
      <Link href={`/furniture/${product.slug}`} className="block focus-visible:outline-offset-4">
        <div className="relative aspect-4/5 w-full overflow-hidden bg-sand-200">
          <Media
            src={image?.url}
            alt={image?.alt ?? product.name}
            priority={priority}
            sizes={sizes ?? "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"}
            imageClassName="transition-transform duration-700 ease-out group-hover:scale-[1.035] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          {soldOut ? (
            <span className="absolute top-3 left-3 bg-ink-950/90 px-2 py-1 text-[0.6875rem] tracking-[0.12em] text-sand-50 uppercase">
              Sold out
            </span>
          ) : null}
          {discounted ? (
            <span className="absolute top-3 right-3 bg-clay-600 px-2 py-1 text-[0.6875rem] tracking-[0.12em] text-sand-50 uppercase">
              {percentLabel ?? "Offer"}
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-display text-lg leading-snug text-ink-950">{product.name}</h3>
            <p className="mt-1 text-sm text-ink-600">
              {product.category.name}
              {product.collection ? ` · ${product.collection.name}` : ""}
            </p>
          </div>
          {discounted ? (
            <div className="shrink-0 pt-0.5 text-right">
              <p className="text-xs tabular-nums text-ink-500 line-through">
                {formatPrice(product.priceCents, product.currency)}
              </p>
              <p className="text-sm font-medium tabular-nums text-clay-700">
                {formatPrice(sellingPrice, product.currency)}
              </p>
            </div>
          ) : (
            <p className="shrink-0 pt-0.5 text-sm tabular-nums text-ink-800">
              {formatPrice(product.priceCents, product.currency)}
            </p>
          )}
        </div>
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <AvailabilityBadge value={product.availability} />
        {saved ? <span className="text-xs font-medium text-clay-700">{saved}</span> : null}
      </div>
    </li>
  );
}
