-- Backfill the denormalised selling price for rows that predate discounts.
-- A product without a discount sells at its list price, so `effectivePriceCents`
-- must equal `priceCents`; the column defaulted to 0 when it was introduced.
UPDATE "Product"
SET "effectivePriceCents" = "priceCents"
WHERE "effectivePriceCents" = 0 AND "priceCents" > 0;
