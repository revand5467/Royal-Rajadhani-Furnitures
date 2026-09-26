import { prisma } from "@/lib/db";

/**
 * Fallback store details.
 *
 * These are used only when the database has not been seeded yet, so a fresh
 * checkout still renders a complete, honest (if empty) site and the admin area
 * can explain what to run. Once seeded, everything here is editable in
 * Admin → Store details / Homepage. Sample values only — replace them with the
 * shop's real details before going live. Nothing here is a street address,
 * email address or opening hours: those fields are left blank in the admin.
 */
/** The editable store details and homepage copy. */
export type StoreSettings = {
  storeName: string;
  tagline: string;
  footerBlurb: string;
  heroHeadline: string;
  heroSubhead: string;
  heroImageUrl: string | null;
  heroImageAlt: string | null;
  storyHeading: string;
  storyBody: string;
  storyImageUrl: string | null;
  storyImageAlt: string | null;
  visitHeading: string;
  visitBody: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  region: string | null;
  postalCode: string | null;
  country: string;
  phone: string;
  email: string;
  mapUrl: string | null;
};

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Rajadhani Furniture",
  tagline: "Teak, mango wood and rosewood furniture for Indian homes",
  footerBlurb:
    "Rajadhani Furniture is a furniture shop in Vattiyoorkavu, Kerala, serving solid teak, mango wood and rosewood pieces for living rooms, dining rooms and studies.",
  heroHeadline: "Furniture made to be kept",
  heroSubhead:
    "Solid teak, mango wood and rosewood pieces for living rooms, dining rooms and studies — crafted and finished in Kerala before delivery.",
  heroImageUrl: "/samples/hero-living-room.jpg",
  heroImageAlt: "Modern living room with sofas, a wooden coffee table and warm natural light",
  storyHeading: "Welcome to Rajadhani Furniture",
  storyBody:
    "Rajadhani Furniture is a furniture shop in Vattiyoorkavu, Kerala, specialising in solid wood furniture for the Indian home. Visit the showroom to explore our current range — sofas, dining tables, wardrobes and more — or send us a message and we will set aside time to talk through the pieces that fit your home.",
  storyImageUrl: "/samples/story-workshop.jpg",
  storyImageAlt: "Workshop bench with hand tools and a half-finished wooden furniture piece",
  visitHeading: "Visit the showroom in Vattiyoorkavu",
  visitBody:
    "Drop in to see the range in person, or call the shop and we will confirm the pieces you are looking for before you visit. We answer every message and arrange delivery to your home.",
  addressLine1: "",
  addressLine2: null,
  city: "Vattiyoorkavu",
  region: "Kerala",
  postalCode: null,
  country: "India",
  phone: "080863 80205",
  email: "",
  mapUrl: null,
};

/**
 * Opening hours start unset: every day shows "Closed" until the shop's real
 * hours are entered in Admin → Store details. The site hides the opening-hours
 * block entirely until at least one day is marked open.
 */
export const DEFAULT_OPENING_HOURS = [
  { dayOfWeek: 1, opens: null, closes: null, closed: false },
  { dayOfWeek: 2, opens: null, closes: null, closed: false },
  { dayOfWeek: 3, opens: null, closes: null, closed: false },
  { dayOfWeek: 4, opens: null, closes: null, closed: false },
  { dayOfWeek: 5, opens: null, closes: null, closed: false },
  { dayOfWeek: 6, opens: null, closes: null, closed: false },
  { dayOfWeek: 0, opens: null, closes: null, closed: false },
];

export const DEFAULT_HIGHLIGHTS = [
  {
    title: "Solid wood",
    body: "Teak, mango wood and rosewood pieces built to last in Indian homes.",
    position: 0,
  },
  {
    title: "See it in person",
    body: "Every piece is on display in our Vattiyoorkavu showroom before you decide.",
    position: 1,
  },
  {
    title: "Delivery arranged",
    body: "Call the shop and we will help you choose the right size and arrange delivery to your home.",
    position: 2,
  },
];

export const DEFAULT_SOCIAL_LINKS = [
  { platform: "Instagram", url: "https://www.instagram.com/royalfurniture_vattiyoorkavu?stkn=b3EyNmg1eTM3M3Nm", position: 0 },
];

export type SiteData = {
  settings: StoreSettings;
  openingHours: Array<{ dayOfWeek: number; opens: string | null; closes: string | null; closed: boolean }>;
  socialLinks: Array<{ platform: string; url: string }>;
  highlights: Array<{ title: string; body: string }>;
  /** false when the database has not been initialised yet */
  ready: boolean;
};

export const FALLBACK_SITE_DATA: SiteData = {
  settings: DEFAULT_SETTINGS,
  openingHours: DEFAULT_OPENING_HOURS,
  socialLinks: DEFAULT_SOCIAL_LINKS,
  highlights: DEFAULT_HIGHLIGHTS,
  ready: false,
};

export async function getSiteData(): Promise<SiteData> {
  try {
    const row = await prisma.siteSettings.findUnique({
      where: { id: "default" },
      include: {
        openingHours: { orderBy: { position: "asc" } },
        socialLinks: { orderBy: { position: "asc" } },
        highlights: { orderBy: { position: "asc" } },
      },
    });

    if (!row) return FALLBACK_SITE_DATA;

    const { openingHours, socialLinks, highlights, createdAt, updatedAt, id, ...settings } = row;
    return {
      // Email is optional in the database; normalise to an empty string so the
      // UI can simply hide the field when nothing has been published.
      settings: { ...settings, email: settings.email ?? "" },
      openingHours: openingHours.map((h) => ({
        dayOfWeek: h.dayOfWeek,
        opens: h.opens,
        closes: h.closes,
        closed: h.closed,
      })),
      socialLinks: socialLinks.map((s) => ({ platform: s.platform, url: s.url })),
      highlights: highlights.map((h) => ({ title: h.title, body: h.body })),
      ready: true,
    };
  } catch (error) {
    console.error("[settings] falling back to defaults:", error instanceof Error ? error.message : error);
    return FALLBACK_SITE_DATA;
  }
}

/** Creates the singleton settings row (plus defaults) if it does not exist. */
export async function ensureSettings() {
  const existing = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  if (existing) return existing;

  return prisma.siteSettings.create({
    data: {
      ...DEFAULT_SETTINGS,
      id: "default",
      openingHours: { create: DEFAULT_OPENING_HOURS.map((h, index) => ({ ...h, position: index })) },
      socialLinks: { create: DEFAULT_SOCIAL_LINKS },
      highlights: { create: DEFAULT_HIGHLIGHTS },
    },
  });
}

export function fullAddress(settings: {
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  region?: string | null;
  postalCode?: string | null;
  country: string;
}): string[] {
  const lines = [settings.addressLine1];
  if (settings.addressLine2) lines.push(settings.addressLine2);
  const locality = [settings.postalCode, settings.city].filter(Boolean).join(" ");
  lines.push([locality, settings.region].filter(Boolean).join(", ").replace(/, $/, ""));
  lines.push(settings.country);
  return lines.filter((line) => line.trim().length > 0);
}
