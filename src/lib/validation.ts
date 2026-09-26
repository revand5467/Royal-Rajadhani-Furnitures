import { z } from "zod";
import { AVAILABILITY, CURRENCIES, INQUIRY_STATUS, PRODUCT_STATUS } from "@/lib/constants";

/* --------------------------------------------------------------------------
   Reusable primitives
-------------------------------------------------------------------------- */

const trimToUndefined = (value: unknown) =>
  value === null || value === undefined || (typeof value === "string" && value.trim() === "")
    ? undefined
    : value;

const optionalText = (max: number) =>
  z.preprocess(trimToUndefined, z.string().trim().max(max, `Please keep this under ${max} characters.`).optional());

const optionalInt = (min: number, max: number, label = "value") =>
  z.preprocess(
    trimToUndefined,
    z.coerce
      .number({ error: `Enter a whole number for ${label}.` })
      .int(`${label} must be a whole number.`)
      .min(min, `${label} must be at least ${min}.`)
      .max(max, `${label} must be under ${max}.`)
      .optional(),
  );

/** Allow blank, then a positive decimal (currencies keep 2 dp; percent is int). */
const optionalAmount = (label = "value") =>
  z.preprocess(
    trimToUndefined,
    z.coerce
      .number({ error: `Enter a number for ${label}.` })
      .min(0, `${label} cannot be negative.`)
      .max(999_999_999, `${label} is too large.`)
      .optional(),
  );

const optionalEmail = z.preprocess(
  trimToUndefined,
  z.string().trim().max(200).refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email address.").optional(),
);

/** Checkboxes only submit when ticked, so treat anything else as false. */
const checkbox = z.preprocess((value) => value === "on" || value === "true" || value === true, z.boolean());

const optionalUrl = (message: string) =>
  z.preprocess(
    trimToUndefined,
    z
      .string()
      .trim()
      .max(500)
      .refine((value) => /^https?:\/\//i.test(value), message)
      .optional(),
  );

export function formDataToObject(formData: FormData): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    if (key in output) {
      const current = output[key];
      output[key] = Array.isArray(current) ? [...current, value] : [current, value];
    } else {
      output[key] = value;
    }
  }
  return output;
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "form";
    if (!result[path]) result[path] = issue.message;
  }
  return result;
}

export const firstError = (error: z.ZodError, path?: string): string => {
  const issue = path ? error.issues.find((i) => i.path.join(".") === path) : error.issues[0];
  return issue?.message ?? "Please check the highlighted fields.";
};

/* --------------------------------------------------------------------------
   Auth
-------------------------------------------------------------------------- */

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address.").max(200),
  password: z.string().min(1, "Enter your password.").max(200),
});

/* --------------------------------------------------------------------------
   Product
-------------------------------------------------------------------------- */

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Give the piece a name of at least 2 characters.")
    .max(120, "Names are limited to 120 characters."),
  slug: optionalText(70),
  summary: z
    .string()
    .trim()
    .min(10, "Write a short summary of at least 10 characters.")
    .max(240, "Summaries are limited to 240 characters."),
  description: z
    .string()
    .trim()
    .min(20, "The full description needs at least 20 characters.")
    .max(8000, "Descriptions are limited to 8000 characters."),
  price: z.coerce
    .number({ error: "Enter a price, for example 2450." })
    .min(0, "Price cannot be negative.")
    .max(9_999_999, "That price seems too high."),
  currency: z.enum(CURRENCIES),
  discountType: z.preprocess(trimToUndefined, z.enum(["PERCENT", "AMOUNT"]).optional()),
  discountValue: optionalAmount(),
  categoryId: z.string().trim().min(1, "Choose a category."),
  collectionId: optionalText(40),
  materials: z
    .string()
    .trim()
    .min(2, "List at least one material, for example “Solid oak, wool”.")
    .max(300),
  finish: optionalText(160),
  widthCm: optionalInt(1, 2000, "Width"),
  depthCm: optionalInt(1, 2000, "Depth"),
  heightCm: optionalInt(1, 2000, "Height"),
  dimensionNote: optionalText(160),
  careInstructions: optionalText(1200),
  availability: z.enum(AVAILABILITY),
  sku: z
    .string()
    .trim()
    .min(1, "A SKU or internal reference is required.")
    .max(60, "SKUs are limited to 60 characters."),
  featured: checkbox,
  status: z.enum(PRODUCT_STATUS),
});
export type ProductInput = z.infer<typeof productSchema>;

/* --------------------------------------------------------------------------
   Taxonomy
-------------------------------------------------------------------------- */

export const categorySchema = z.object({
  id: optionalText(40),
  name: z.string().trim().min(2, "Category names need at least 2 characters.").max(80),
  slug: optionalText(70),
  blurb: optionalText(300),
  position: z.coerce.number().int().min(0).max(999).default(0),
});

export const collectionSchema = z.object({
  id: optionalText(40),
  name: z.string().trim().min(2, "Collection names need at least 2 characters.").max(80),
  slug: optionalText(70),
  blurb: optionalText(300),
  position: z.coerce.number().int().min(0).max(999).default(0),
  featured: checkbox,
});

/* --------------------------------------------------------------------------
   Store settings & homepage content
-------------------------------------------------------------------------- */

/** Store details & contact configuration (Admin → Store details). */
export const storeDetailsSchema = z.object({
  storeName: z.string().trim().min(2, "Store name is required.").max(120),
  tagline: z.string().trim().min(2, "A short tagline is required.").max(160),
  footerBlurb: z.string().trim().min(10, "The footer blurb needs at least 10 characters.").max(400),
  // Optional — the site has no street address to record.
  addressLine1: optionalText(160),
  addressLine2: optionalText(160),
  city: z.string().trim().min(1, "City is required.").max(120),
  region: optionalText(120),
  postalCode: optionalText(40),
  country: z.string().trim().min(2, "Country is required.").max(120),
  phone: z.string().trim().min(4, "A phone number is required.").max(60),
  // Optional — left blank when the shop has not published an email address.
  email: optionalEmail,
  mapUrl: optionalUrl("Map links must start with http:// or https://."),
});

/** Homepage hero, story and visit-band copy (Admin → Homepage). */
export const homepageSchema = z.object({
  heroHeadline: z.string().trim().min(4, "The hero headline is required.").max(160),
  heroSubhead: z.string().trim().min(10, "Add a line of supporting copy.").max(400),
  heroImageUrl: optionalText(500),
  heroImageAlt: optionalText(240),
  storyHeading: z.string().trim().min(4, "The story heading is required.").max(160),
  storyBody: z.string().trim().min(20, "The brand story needs at least 20 characters.").max(4000),
  storyImageUrl: optionalText(500),
  storyImageAlt: optionalText(240),
  visitHeading: z.string().trim().min(4, "The visit heading is required.").max(160),
  visitBody: z.string().trim().min(10, "Add a line about visiting the showroom.").max(600),
});

export type StoreDetailsInput = z.infer<typeof storeDetailsSchema>;
export type HomepageInput = z.infer<typeof homepageSchema>;

export const openingHourSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  opens: optionalText(20),
  closes: optionalText(20),
  closed: checkbox,
});

export const socialLinkSchema = z.object({
  platform: z.string().trim().min(1, "Name the network.").max(40),
  url: z.string().trim().min(1, "Add the profile URL.").max(500).refine((v) => /^https?:\/\//i.test(v), "Links must start with http:// or https://."),
});

export const highlightSchema = z.object({
  title: z.string().trim().min(2, "Give the highlight a title.").max(80),
  body: z.string().trim().min(5, "Add a sentence of detail.").max(300),
});

/* --------------------------------------------------------------------------
   Images & inquiries
-------------------------------------------------------------------------- */

export const externalImageSchema = z.object({
  productId: z.string().trim().min(1),
  url: z
    .string()
    .trim()
    .max(600)
    .refine((v) => /^https:\/\//i.test(v), "External images must be served over https."),
  alt: z.string().trim().min(3, "Describe the image for screen readers and search engines.").max(240),
  credit: optionalText(200),
});

export const imageMetaSchema = z.object({
  productId: z.string().trim().min(1),
  alt: z.string().trim().max(240).optional(),
});

export const inquirySchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name.").max(120),
  email: z.string().trim().max(200).refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email address."),
  phone: optionalText(60),
  subject: optionalText(160),
  message: z
    .string()
    .trim()
    .min(10, "Please add a little more detail (at least 10 characters).")
    .max(4000, "Messages are limited to 4000 characters."),
  productId: optionalText(40),
  sourcePath: optionalText(300),
  /** Honeypot — real people never fill this in. */
  company: z.string().max(0, "Submission rejected.").optional().or(z.literal("")),
  /** Milliseconds the visitor spent on the form before submitting. */
  elapsedMs: optionalText(20),
});

export const inquiryStatusSchema = z.object({ status: z.enum(INQUIRY_STATUS) });
