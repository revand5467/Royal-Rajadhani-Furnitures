export const AVAILABILITY = ["IN_STOCK", "MADE_TO_ORDER", "PRE_ORDER", "SOLD_OUT"] as const;
export type Availability = (typeof AVAILABILITY)[number];

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  IN_STOCK: "Available in the showroom",
  MADE_TO_ORDER: "Made to order",
  PRE_ORDER: "Pre-order",
  SOLD_OUT: "Currently sold out",
};

export const AVAILABILITY_SHORT: Record<Availability, string> = {
  IN_STOCK: "In the showroom",
  MADE_TO_ORDER: "Made to order",
  PRE_ORDER: "Pre-order",
  SOLD_OUT: "Sold out",
};

export const PRODUCT_STATUS = ["DRAFT", "PUBLISHED"] as const;
export type ProductStatus = (typeof PRODUCT_STATUS)[number];

export const INQUIRY_STATUS = ["NEW", "READ", "RESOLVED"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUS)[number];

export const INQUIRY_KIND = ["CONTACT", "PRODUCT"] as const;

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "CAD", "AUD", "SEK"] as const;

/** Catalog sorting. `featured` puts curated picks first, then newest. */
export const SORT_OPTIONS = ["featured", "newest", "name", "price-asc", "price-desc"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const SORT_LABELS: Record<SortOption, string> = {
  featured: "Featured",
  newest: "Newest",
  name: "Name (A–Z)",
  "price-asc": "Price (low to high)",
  "price-desc": "Price (high to low)",
};

export const PAGE_SIZE = 9;
export const ADMIN_PAGE_SIZE = 12;

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
// Display order for opening hours: Monday first.
export const WEEKDAY_ORDER: readonly number[] = [1, 2, 3, 4, 5, 6, 0];

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif";
export const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"] as const;
