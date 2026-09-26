/**
 * Discount maths and price presentation.
 *
 * Prices are stored as integer paise (the project-wide "cents"). A product may
 * carry one discount — a percentage of the original price or a fixed amount —
 * and the resulting selling price is denormalised onto the product row as
 * `effectivePriceCents` by `saveProduct`, so catalog filtering and sorting stay
 * simple typed Prisma queries. This module is the single source of truth for
 * that arithmetic and is safe to import from client components.
 */

export const DISCOUNT_TYPES = ["PERCENT", "AMOUNT"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  PERCENT: "Percentage off (%)",
  AMOUNT: "Fixed amount off",
};

import { formatPrice } from "@/lib/format";

export type PriceInput = {
  priceCents: number;
  discountType?: string | null;
  discountPercent?: number | null;
  discountValueCents?: number | null;
};

/** True when the row carries a usable discount (type + positive value). */
export function hasDiscount(product: PriceInput): boolean {
  if (product.priceCents <= 0) return false;
  if (product.discountType === "PERCENT") return (product.discountPercent ?? 0) > 0;
  if (product.discountType === "AMOUNT") return (product.discountValueCents ?? 0) > 0;
  return false;
}

/**
 * How much the discount takes off the original price, in paise. Clamped so a
 * mistyped value can never produce a negative or above-list selling price.
 */
export function discountAmountCents(product: PriceInput): number {
  if (!hasDiscount(product)) return 0;
  if (product.discountType === "PERCENT") {
    const percent = Math.min(100, Math.max(0, product.discountPercent ?? 0));
    return Math.min(product.priceCents, Math.round((product.priceCents * percent) / 100));
  }
  return Math.min(product.priceCents, Math.max(0, product.discountValueCents ?? 0));
}

/** The price a customer pays, in paise. Equals `priceCents` without a discount. */
export function effectivePriceCents(product: PriceInput): number {
  return product.priceCents - discountAmountCents(product);
}

/** "10% off" / "12.5% off" / null when there is no percentage discount. */
export function discountPercentLabel(product: PriceInput): string | null {
  if (product.discountType !== "PERCENT" || !hasDiscount(product)) return null;
  const percent = product.discountPercent ?? 0;
  const rounded = Math.round(percent * 100) / 100;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(2)}% off`;
}

/** "Save ₹1,500" in the row's currency, or null when there is no discount. */
export function savingsLabel(product: PriceInput & { currency?: string }): string | null {
  if (!hasDiscount(product)) return null;
  const saved = discountAmountCents(product);
  if (saved <= 0) return null;
  const currency = "currency" in product && typeof product.currency === "string" ? product.currency : "INR";
  return `Save ${formatPrice(saved, currency)}`;
}
