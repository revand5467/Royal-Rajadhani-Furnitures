/**
 * Seeds a realistic demonstration catalogue.
 *
 *   bun run db:seed          # adds the sample data to an empty database
 *   bun run db:seed --force  # deletes all products first, then reseeds
 *
 * Categories, collections, store settings and the first admin account are
 * always created if missing. Products are only inserted when the catalogue is
 * empty, so re-running never overwrites real work.
 *
 * Photography: the files referenced here live in `public/samples` and are CC0 /
 * CC-BY images fetched by `scripts/fetch-sample-photos.ts`; `credits.json`
 * records the creator, licence and source page for each one. Replace them with
 * your own shop photography through the admin area at any time.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { effectivePriceCents } from "@/lib/pricing";

const prisma = new PrismaClient();
const force = process.argv.includes("--force");
const SAMPLES = path.join(process.cwd(), "public", "samples");

type Credit = {
  file: string;
  creator: string;
  license: string;
  source: string;
  sourceUrl: string;
};

function loadCredits(): Map<string, Credit> {
  const manifest = path.join(SAMPLES, "credits.json");
  if (!existsSync(manifest)) return new Map();
  try {
    const parsed = JSON.parse(readFileSync(manifest, "utf8")) as Credit[];
    return new Map(parsed.map((entry) => [entry.file, entry]));
  } catch {
    return new Map();
  }
}

const credits = loadCredits();

function sampleUrl(index: number): string {
  return `/samples/piece-${String(index).padStart(2, "0")}.jpg`;
}

function creditFor(index: number): string | null {
  const entry = credits.get(sampleUrl(index));
  return entry ? `${entry.creator} — ${entry.source}, ${entry.license}` : null;
}

/** Sample files are reported but never fatal — the seed still completes. */
const missing = new Set<number>();

const CATEGORIES = [
  { name: "Seating", slug: "seating", blurb: "Sofas, armchairs and lounge chairs built around a solid frame.", position: 1 },
  { name: "Tables & desks", slug: "tables-desks", blurb: "Coffee tables, side tables and writing desks.", position: 2 },
  { name: "Dining", slug: "dining", blurb: "Tables and seating for the room where everyone gathers.", position: 3 },
  { name: "Storage", slug: "storage", blurb: "Shelving and sideboards that hold their nerve for decades.", position: 4 },
  { name: "Lighting", slug: "lighting", blurb: "Warm, low-glare light in wood and hand-blown glass.", position: 5 },
];

const COLLECTIONS = [
  { name: "Small spaces", slug: "small-spaces", blurb: "Full-size comfort, apartment-scale footprints.", position: 1, featured: true },
  { name: "The oak series", slug: "oak-series", blurb: "One timber, one finish, drawn across the whole house.", position: 2, featured: true },
  { name: "Quiet corners", slug: "quiet-corners", blurb: "Reading chairs and soft light for the edge of a room.", position: 3, featured: true },
];

type SeededProduct = {
  name: string;
  slug: string;
  summary: string;
  description: string;
  price: number;
  currency: string;
  /** Optional demo discount — either a percentage or a fixed rupee amount. */
  discount?: { type: "PERCENT" | "AMOUNT"; value: number };
  category: string;
  collection: string | null;
  materials: string;
  finish: string;
  dimensions: [number, number, number | null];
  dimensionNote?: string;
  care: string;
  availability: string;
  sku: string;
  featured: boolean;
  status: string;
  images: Array<{ index: number; alt: string }>;
};

const PRODUCTS: SeededProduct[] = [
  {
    name: "Halden three-seat sofa",
    slug: "halden-three-seat-sofa",
    summary:
      "A low three-seater with a solid beech frame and feather-wrapped seats — deep enough to read in, compact enough for a city room.",
    description:
      "Halden is the sofa we build most often, and the one we have refined the longest. The frame is kiln-dried beech, joined with dowels and corner blocks rather than staples, so it can be taken apart and repaired rather than replaced.\n\nThe seat cushions are wrapped in feathers over a high-resilience foam core: soft on the first sit, and still supportive after a decade. The cover unzips completely, which means the whole thing can be re-upholstered in the workshop without the frame ever leaving the building.\n\nShown in oatmeal wool bouclé on soaped oak legs. Around 30 fabric qualities and eight leg finishes are available in the showroom.",
    price: 44500,
    currency: "INR",
    discount: { type: "PERCENT", value: 15 },
    category: "seating",
    collection: "small-spaces",
    materials: "Kiln-dried beech frame, feather-wrapped cushions, wool bouclé cover, solid oak legs",
    finish: "Oatmeal bouclé with soaped oak legs",
    dimensions: [210, 92, 74],
    dimensionNote: "Seat height 42 cm, seat depth 62 cm",
    care: "Vacuum the cover monthly with a brush head. Rotate the seat cushions weekly for the first months. Covers unzip and can be dry-cleaned or replaced; contact the workshop for re-upholstery.",
    availability: "IN_STOCK",
    sku: "AN-SOF-101",
    featured: true,
    status: "PUBLISHED",
    images: [
      { index: 1, alt: "Pale three-seat sofa with linen and grey cushions in a bright, plainly decorated living room" },
      { index: 2, alt: "Close view of the Halden sofa's warm camel upholstery and timber frame in afternoon light" },
    ],
  },
  {
    name: "Marlow modular sofa",
    slug: "marlow-modular-sofa",
    summary:
      "Sectional seating made from freely arrangeable modules — a two-metre settee today, a corner group when the room changes.",
    description:
      "Marlow is built from modules 95 cm wide, each with its own frame and levelling feet, joined by concealed steel brackets. Add a chaise, split the group across a window, or move the whole thing to a larger flat without replacing it.\n\nThe dark grey wool is a dense, tightly woven fabric chosen for households with animals; it resists pilling and shrugs off most marks with a damp cloth.\n\nEvery module is quoted separately so you can build the set that fits your room exactly.",
    price: 52000,
    currency: "INR",
    discount: { type: "AMOUNT", value: 6000 },
    category: "seating",
    collection: "oak-series",
    materials: "Beech and plywood frames, dense wool upholstery, concealed steel brackets",
    finish: "Slate grey wool, blackened oak feet",
    dimensions: [285, 98, 68],
    dimensionNote: "Each module 95 cm wide; chaise 160 cm deep",
    care: "Blot spills immediately with a clean cloth. Brush rather than rub the wool pile. Modules can be separated without tools for cleaning underneath.",
    availability: "MADE_TO_ORDER",
    sku: "AN-SOF-102",
    featured: true,
    status: "PUBLISHED",
    images: [
      { index: 3, alt: "Charcoal grey modular sofa with a low travertine coffee table and large windows" },
      { index: 4, alt: "Grey sofa and armchair in a room with tall windows and pale walls" },
    ],
  },
  {
    name: "Fjord two-seat sofa",
    slug: "fjord-two-seat-sofa",
    summary:
      "A mid-century two-seater with splayed oak legs and a tight back — the piece that gave the workshop its name.",
    description:
      "Fjord is based on a 1958 drawing we found in a Dutch pattern book and have quietly redrawn ever since. The tight back keeps its shape, the seat is firm, and the whole sofa is only 78 cm deep, which is what makes it work in a narrow room.\n\nWe build the frame in European oak with mortise-and-tenon joints and finish it with a soap-and-wax mix that can be refreshed at home.",
    price: 29800,
    currency: "INR",
    category: "seating",
    collection: "oak-series",
    materials: "Solid European oak, wool-hemp blend upholstery, natural latex seat cushions",
    finish: "Mustard wool over soaped oak",
    dimensions: [172, 78, 78],
    dimensionNote: "Seat height 40 cm",
    care: "Re-oil or re-soap the oak annually. Vacuum the wool with a soft brush. Keep out of direct sun to slow fading.",
    availability: "IN_STOCK",
    sku: "AN-SOF-103",
    featured: false,
    status: "PUBLISHED",
    images: [
      { index: 5, alt: "Two-seat sofa with warm upholstery in a sitting room with framed artwork above it" },
      { index: 6, alt: "Tan upholstered sofa standing alone in an empty room with pale flooring" },
    ],
  },
  {
    name: "Sigrid lounge chair",
    slug: "sigrid-lounge-chair",
    summary:
      "A deep, low lounge chair with a tall back and a patterned wool cover woven in the Netherlands.",
    description:
      "Sigrid is the chair people sink into and then ask about. The back is high enough to rest a head, the seat is spring-supported rather than webbed, and the arms are just wide enough for a cup.\n\nThe cover is a jacquard wool woven in Tilburg in small runs; each batch differs slightly, which is part of the point.",
    price: 21500,
    currency: "INR",
    discount: { type: "PERCENT", value: 10 },
    category: "seating",
    collection: "quiet-corners",
    materials: "Oak frame, jacquard wool cover, sprung seat, hand-turned legs",
    finish: "Botanical jacquard wool, dark oak legs",
    dimensions: [82, 90, 98],
    dimensionNote: "Seat height 43 cm",
    care: "Vacuum with a brush head. Professional dry clean for the cover; the frame needs no more than a dry cloth.",
    availability: "IN_STOCK",
    sku: "AN-CHR-201",
    featured: false,
    status: "PUBLISHED",
    images: [
      { index: 7, alt: "Patterned wool lounge chair standing beside a vintage wooden cabinet" },
      { index: 8, alt: "Green velvet armchair seen from an angle in the corner of a room" },
    ],
  },
  {
    name: "Bea club chair",
    slug: "bea-club-chair",
    summary:
      "A compact leather club chair built on a hardwood frame, with a back that supports rather than swallows.",
    description:
      "Bea is a scaled-down club chair: 74 cm wide, so it works beside a sofa instead of demanding its own wall. The frame is hardwood, the seat is webbed by hand, and the leather is a vegetable-tanned hide that will darken over ten years into something much better than new.\n\nWe keep a sample of every hide we use, because no two chairs are quite the same colour.",
    price: 24500,
    currency: "INR",
    category: "seating",
    collection: null,
    materials: "Hardwood frame, vegetable-tanned leather, hand-webbed seat",
    finish: "Natural tan leather",
    dimensions: [74, 86, 78],
    dimensionNote: "Seat height 41 cm",
    care: "Dust with a dry cloth; condition the leather once a year with a neutral cream. Keep away from radiators, which dry the hide.",
    availability: "MADE_TO_ORDER",
    sku: "AN-CHR-202",
    featured: false,
    status: "PUBLISHED",
    images: [
      { index: 9, alt: "Tan leather club chair photographed against a plain pink wall" },
      { index: 10, alt: "Patterned armchair in a living room with a tall window and pale walls" },
    ],
  },
  {
    name: "Kite tub chair",
    slug: "kite-tub-chair",
    summary:
      "A moulded tub chair with a curved shell and a swivel base — designed for corners, desks and waiting rooms.",
    description:
      "Kite is a compact tub chair with a shell pressed from a single sheet of oak veneer, upholstered on the inside and left bare on the outside so the grain reads. The base swivels on a machined aluminium bearing.\n\nIt is the chair we make for people who need somewhere good to sit in a space that cannot take a sofa.",
    price: 12900,
    currency: "INR",
    category: "seating",
    collection: "small-spaces",
    materials: "Pressed oak veneer shell, wool seat pad, machined aluminium swivel base",
    finish: "Cobalt wool, natural oak shell",
    dimensions: [68, 66, 74],
    dimensionNote: "Seat height 44 cm",
    care: "Wipe the shell with a damp cloth. The seat pad is removable and can be dry-cleaned.",
    availability: "PRE_ORDER",
    sku: "AN-CHR-203",
    featured: true,
    status: "PUBLISHED",
    images: [
      { index: 11, alt: "Blue upholstered tub chair photographed against a deep blue studio background" },
      { index: 12, alt: "Modern lounge interior with a curved sofa, armchairs and a chandelier" },
    ],
  },
  {
    name: "Nook coffee table",
    slug: "nook-coffee-table",
    summary:
      "A low table in solid oak with a stone inlay top and a shelf for the things that migrate off it.",
    description:
      "Nook is 120 by 60 cm — long enough for three people's cups, narrow enough to walk around. The top is solid oak with a limestone inlay in the centre that takes the heat of a teapot and looks better for it.\n\nThe lower shelf is where magazines and remotes are supposed to live, which in practice means they do.",
    price: 11800,
    currency: "INR",
    category: "tables-desks",
    collection: "oak-series",
    materials: "Solid oak top, limestone inlay, oak underframe",
    finish: "Soaped oak with pale limestone",
    dimensions: [120, 60, 38],
    dimensionNote: "Shelf height 14 cm",
    care: "Wipe with a damp cloth and re-soap twice a year. Stone inlays should be sealed annually; the showroom does this free of charge.",
    availability: "IN_STOCK",
    sku: "AN-TBL-301",
    featured: true,
    status: "PUBLISHED",
    images: [
      { index: 13, alt: "Glass-topped coffee table with a chrome frame standing on a dark floor" },
      { index: 14, alt: "Living room with a pale sofa, marble side table and sheer curtains" },
    ],
  },
  {
    name: "Elling writing desk",
    slug: "elling-writing-desk",
    summary:
      "A compact desk with a solid oak top, a single deep drawer and cable routing built into the back rail.",
    description:
      "Elling is 130 cm wide, which is enough room for a laptop, a notebook and a lamp without turning a corner of the flat into an office. The drawer runs on wooden runners — quiet, and repairable with a plane and a candle.\n\nCables disappear through a removable back panel, and the whole desk comes apart into five pieces for transport up narrow stairs.",
    price: 18900,
    currency: "INR",
    category: "tables-desks",
    collection: "oak-series",
    materials: "Solid oak top and legs, ash drawer box, brass pull",
    finish: "Lacquered oak with an unlacquered brass pull",
    dimensions: [130, 60, 74],
    dimensionNote: "Drawer depth 45 cm",
    care: "Wipe the lacquer with a damp cloth. Brass will patina; polish it only if you want it bright.",
    availability: "IN_STOCK",
    sku: "AN-DSK-302",
    featured: false,
    status: "DRAFT",
    images: [
      { index: 15, alt: "Writing desk with a laptop and papers standing on a patterned rug" },
      { index: 16, alt: "Laptop resting on a grey sofa in a home workspace" },
    ],
  },
  {
    name: "Skagen dining table",
    slug: "skagen-dining-table",
    summary:
      "A nine-foot plank-top table that seats eight, in one piece of oak with a breadboard end.",
    description:
      "Skagen is built from three oak planks cut from the same tree, joined so the grain runs continuously across the top. The breadboard ends are pinned, not glued, so the table can move with the seasons without cracking.\n\nIt seats six comfortably and eight pleasantly. We deliver it assembled within Kerala and can add a second leaf on request.",
    price: 36800,
    currency: "INR",
    category: "dining",
    collection: "oak-series",
    materials: "Solid oak top with breadboard ends, solid oak trestle base",
    finish: "Natural oil-wax",
    dimensions: [240, 95, 74],
    dimensionNote: "Seats six to eight",
    care: "Wipe up spills at once. Re-oil once or twice a year with the supplied wax, working with the grain. Deep scratches can be sanded and re-oiled.",
    availability: "IN_STOCK",
    sku: "AN-DIN-401",
    featured: true,
    status: "PUBLISHED",
    images: [
      { index: 17, alt: "Dining table with chairs in a simple modern kitchen and dining area" },
      { index: 18, alt: "Dining space with a wooden table laid with ceramic bowls beside a window" },
    ],
  },
  {
    name: "Rack bookshelf",
    slug: "rack-bookshelf",
    summary:
      "A tall oak bookshelf with adjustable shelves and a low shelf deep enough for records.",
    description:
      "Rack is the simplest thing we make and the one we make the most carefully: uprights joined to a solid plinth, shelves on brass pins every 32 mm, and a back brace so it does not lean.\n\nThe bottom shelf is 45 cm deep for records and oversize books; the rest are 30 cm. It is designed to stand against a wall but will also hold its own as a room divider between two rooms.",
    price: 16400,
    currency: "INR",
    category: "storage",
    collection: null,
    materials: "Solid oak uprights, oak veneer shelves, brass pins",
    finish: "Soaped oak",
    dimensions: [96, 34, 210],
    dimensionNote: "Bottom shelf 45 cm deep; shelves adjustable every 32 mm",
    care: "Do not overload a single shelf. Anchor the back brace to the wall in households with children, using the supplied bracket.",
    availability: "IN_STOCK",
    sku: "AN-STO-501",
    featured: false,
    status: "PUBLISHED",
    images: [
      { index: 19, alt: "Tall wooden bookshelf filled with books in a wood-panelled living room" },
      { index: 20, alt: "Reading corner with wooden shelves, tables and soft natural light" },
    ],
  },
  {
    name: "Lattice pendant lamp",
    slug: "lattice-pendant-lamp",
    summary:
      "A hand-assembled pendant of oak battens around a warm, dimmable bulb — big, quiet light over a table.",
    description:
      "Lattice is built from ninety-six tapered oak battens, assembled by hand around a steel ring. The light is deliberately warm and indirect: you see the timber, not the bulb.\n\nIt is heavy enough to need a proper ceiling fixing, which we supply, and it dims beautifully to a five per cent glow for late evenings.",
    price: 9800,
    currency: "INR",
    discount: { type: "PERCENT", value: 20 },
    category: "lighting",
    collection: "quiet-corners",
    materials: "Tapered oak battens, powder-coated steel ring, braided cotton flex, dimmable LED",
    finish: "Natural oak, black flex",
    dimensions: [80, 80, 42],
    dimensionNote: "Drop 180 cm, adjustable on site",
    care: "Dust with a soft brush or a hairdryer on a cool, low setting. The LED module is replaceable and we keep spares for ten years.",
    availability: "IN_STOCK",
    sku: "AN-LGT-601",
    featured: true,
    status: "PUBLISHED",
    images: [
      { index: 21, alt: "Large wooden lattice pendant lamp hanging in a high room with tall windows" },
      { index: 22, alt: "Second view of the oak lattice pendant, showing the timber battens from below" },
    ],
  },
];

const SAMPLE_INQUIRIES = [
  {
    name: "Anjali Menon",
    email: "anjali.menon@example.com",
    phone: "+91 98470 22110",
    subject: "Halden sofa in a different upholstery",
    message:
      "We are furnishing a living room with a lot of afternoon light and would like the Halden in a slightly darker fabric. Could you share the options you have in the showroom, and what the current lead time is? We can visit Vattiyoorkavu on a weekend.",
    kind: "PRODUCT",
    productSlug: "halden-three-seat-sofa",
    sourcePath: "/furniture/halden-three-seat-sofa",
    status: "NEW",
  },
  {
    name: "Rahul Nair",
    email: "rahul.nair@example.com",
    phone: null,
    subject: "Visit on Saturday",
    message:
      "Coming from Kazhakkoottam on Saturday with measurements for a dining room. Is the Skagen table on display, and do you have matching chairs in stock? Happy to book a slot if that helps.",
    kind: "CONTACT",
    productSlug: null,
    sourcePath: "/contact",
    status: "READ",
  },
];

async function main() {
  console.log("Seeding Rajadhani Furniture…\n");

  // Store settings & default homepage content ------------------------------
  const { DEFAULT_SETTINGS, DEFAULT_OPENING_HOURS, DEFAULT_SOCIAL_LINKS, DEFAULT_HIGHLIGHTS } = await import(
    "../src/lib/settings"
  );
  const existingSettings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  if (!existingSettings) {
    await prisma.siteSettings.create({
      data: {
        ...DEFAULT_SETTINGS,
        id: "default",
        openingHours: { create: DEFAULT_OPENING_HOURS.map((hour, index) => ({ ...hour, position: index })) },
        socialLinks: { create: DEFAULT_SOCIAL_LINKS },
        highlights: { create: DEFAULT_HIGHLIGHTS },
      },
    });
    console.log("✔ Store details and homepage content created (sample values — edit them in the admin area)");
  } else if (force) {
    // --force is a full demo reset: bring the store details back to the
    // Rajadhani Furniture defaults as well as replacing the catalogue.
    await prisma.$transaction([
      prisma.siteSettings.update({
        where: { id: "default" },
        data: { ...DEFAULT_SETTINGS, email: DEFAULT_SETTINGS.email || null },
      }),
      prisma.openingHour.deleteMany({ where: { settingsId: "default" } }),
      prisma.socialLink.deleteMany({ where: { settingsId: "default" } }),
      prisma.highlight.deleteMany({ where: { settingsId: "default" } }),
      prisma.openingHour.createMany({
        data: DEFAULT_OPENING_HOURS.map((hour, index) => ({ ...hour, settingsId: "default", position: index })),
      }),
      prisma.socialLink.createMany({
        data: DEFAULT_SOCIAL_LINKS.map((link) => ({ ...link, settingsId: "default" })),
      }),
      prisma.highlight.createMany({
        data: DEFAULT_HIGHLIGHTS.map((highlight) => ({ ...highlight, settingsId: "default" })),
      }),
    ]);
    console.log("✔ Store details reset to the Rajadhani Furniture defaults (--force)");
  } else {
    console.log("· Store details already present, left untouched");
  }

  // Categories & collections ----------------------------------------------
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, blurb: category.blurb, position: category.position },
      create: category,
    });
  }
  console.log(`✔ ${CATEGORIES.length} categories ready`);

  for (const collection of COLLECTIONS) {
    await prisma.collection.upsert({
      where: { slug: collection.slug },
      update: {
        name: collection.name,
        blurb: collection.blurb,
        position: collection.position,
        featured: collection.featured,
      },
      create: collection,
    });
  }
  console.log(`✔ ${COLLECTIONS.length} collections ready`);

  // Products ---------------------------------------------------------------
  const productCount = await prisma.product.count();
  if (productCount > 0 && !force) {
    console.log(`· ${productCount} listings already exist — skipping products (use --force to replace them)`);
  } else {
    if (force && productCount > 0) {
      await prisma.product.deleteMany();
      console.log(`· Removed ${productCount} existing listings`);
    }

    const categories = await prisma.category.findMany();
    const collections = await prisma.collection.findMany();
    const categoryBySlug = new Map(categories.map((category) => [category.slug, category.id]));
    const collectionBySlug = new Map(collections.map((collection) => [collection.slug, collection.id]));

    for (const product of PRODUCTS) {
      const categoryId = categoryBySlug.get(product.category);
      if (!categoryId) {
        console.warn(`! Skipping ${product.name}: category ${product.category} is missing`);
        continue;
      }

      const [width, depth, height] = product.dimensions;
      const priceCents = Math.round(product.price * 100);
      const discountType = product.discount?.type ?? null;
      const discountPercent = product.discount?.type === "PERCENT" ? product.discount.value : null;
      const discountValueCents = product.discount?.type === "AMOUNT" ? Math.round(product.discount.value * 100) : null;
      await prisma.product.create({
        data: {
          name: product.name,
          slug: product.slug,
          summary: product.summary,
          description: product.description,
          priceCents,
          discountType,
          discountPercent,
          discountValueCents,
          effectivePriceCents: effectivePriceCents({ priceCents, discountType, discountPercent, discountValueCents }),
          currency: product.currency,
          categoryId,
          collectionId: product.collection ? (collectionBySlug.get(product.collection) ?? null) : null,
          materials: product.materials,
          finish: product.finish,
          widthCm: width,
          depthCm: depth,
          heightCm: height ?? null,
          dimensionNote: product.dimensionNote ?? null,
          careInstructions: product.care,
          availability: product.availability,
          sku: product.sku,
          featured: product.featured,
          status: product.status,
          publishedAt: product.status === "PUBLISHED" ? new Date() : null,
          images: {
            create: product.images.map((image, position) => ({
              ...imageData(image.index, image.alt),
              position,
              isCover: position === 0,
            })),
          },
        },
      });
      console.log(`  · ${product.name} (${product.images.length} images, ${product.status.toLowerCase()})`);
    }
    console.log(`✔ ${PRODUCTS.length} listings created`);
  }

  // Sample inquiries -------------------------------------------------------
  const inquiryCount = await prisma.inquiry.count();
  if (inquiryCount === 0) {
    for (const inquiry of SAMPLE_INQUIRIES) {
      const product = inquiry.productSlug
        ? await prisma.product.findUnique({ where: { slug: inquiry.productSlug }, select: { id: true } })
        : null;
      await prisma.inquiry.create({
        data: {
          name: inquiry.name,
          email: inquiry.email,
          phone: inquiry.phone,
          subject: inquiry.subject,
          message: inquiry.message,
          kind: inquiry.kind,
          status: inquiry.status,
          productId: product?.id ?? null,
          sourcePath: inquiry.sourcePath,
        },
      });
    }
    console.log(`✔ ${SAMPLE_INQUIRIES.length} sample inquiries created (safe to delete in the admin area)`);
  } else {
    console.log(`· ${inquiryCount} inquiries already present, left untouched`);
  }

  // Admin account ----------------------------------------------------------
  const adminCount = await prisma.adminUser.count();
  const email = (process.env.SEED_ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "";

  if (adminCount === 0) {
    if (!email || password.length < 8 || /(change-this|changeme|password|replace-me)/i.test(password)) {
      console.log(
        "! No admin account created: set SEED_ADMIN_EMAIL and a non-placeholder SEED_ADMIN_PASSWORD in .env,\n" +
          "  or run `bun run admin:create you@example.com 'GoodPassword'`.",
      );
    } else {
      await prisma.adminUser.create({
        data: {
          email,
          name: process.env.SEED_ADMIN_NAME ?? "Studio manager",
          passwordHash: await bcrypt.hash(password, 10),
        },
      });
      console.log(`✔ Admin account created for ${email}`);
      console.log("  Change this password before deploying, and set a real AUTH_SECRET.");
    }
  } else {
    console.log(`· ${adminCount} admin account(s) already exist, left untouched`);
  }

  if (missing.size) {
    const list = [...missing].sort((a, b) => a - b);
    console.warn(
      `\n! ${list.length} sample photograph(s) are missing from public/samples ` +
        `(${list.slice(0, 6).map((index) => `piece-${String(index).padStart(2, "0")}.jpg`).join(", ")}${list.length > 6 ? ", …" : ""}).\n` +
        "  Run `bun run photos:fetch` then `bun run photos:pick …`, or upload your own images in the admin area.",
    );
  }

  console.log("\nDone. Start the site with `bun run dev` and sign in at /admin/login.");
}

function imageData(index: number, alt: string) {
  const url = sampleUrl(index);
  if (!existsSync(path.join(SAMPLES, path.basename(url)))) missing.add(index);
  const credit = creditFor(index);
  return credit ? { url, alt, credit } : { url, alt };
}

main()
  .catch((error) => {
    console.error("\n✖ Seeding failed:", error instanceof Error ? error.message : error);
    if (error instanceof Error && /no such table|does not exist|relation/i.test(error.message)) {
      console.error("  The schema is missing — run `bun run db:migrate` first.");
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
