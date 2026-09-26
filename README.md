# Rajadhani Furniture — furniture showcase + admin CMS

An editorial-style furniture showcase for **Rajadhani Furniture**, a furniture shop in
**Vattiyoorkavu, Kerala, India**, with a photography-led storefront and a full admin area for
managing the catalogue. Prices are shown in Indian rupees (e.g. `₹44,500`) and any piece can carry
a percentage or fixed-amount discount. There is **no cart or checkout anywhere** — the shop sells
in-person; the site drives showroom visits and inquiries.

Built with **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + Prisma + SQLite**
(zero-config locally, switchable to PostgreSQL for deployment — see [Deployment](#deployment)).

---

## 1. Quick brief for coding agents

If you are an AI coding agent (or a new developer) dropped into this repo, start here.

### Project facts

| Fact | Value |
| --- | --- |
| App type | Single Next.js app: public storefront + session-authenticated admin CMS |
| Package manager | Scripts assume **Bun** (`bun run …`); `npm`/Node 20+ works for dev/build/start — see caveats below |
| Node version used in development | 22.x |
| Framework | Next.js 16, App Router, Turbopack builds, React 19, `"use server"` server actions for **all** mutations |
| Styling | Tailwind CSS v4 via `@tailwindcss/postcss`; design tokens live in `src/app/globals.css` under `@theme` (no `tailwind.config`) |
| Database | Prisma 6 + SQLite at `prisma/dev.db` (file lives relative to `prisma/`) |
| Auth | HS256 JWT session cookie signed with `jose`, password hashes with `bcryptjs` |
| Images | `sharp` normalises uploads to WebP (max 2400px) and writes them under `UPLOAD_DIR`; served by `/media/[...key]` with immutable caching |
| Validation | `zod`, server-side, on every server action |
| Currency | Integer **paise** everywhere in the DB (`priceCents`, `effectivePriceCents`); formatted to ₹ at the render layer |
| Secrets | All local config in `.env` (git-ignored); `.env.example` documents every variable |
| Sample data | `prisma/seed.ts` creates 11 INR-priced listings, 5 categories, 3 collections, store settings, opening hours and 2 inquiries |

### Non-obvious conventions (things agents get wrong)

1. **All writes go through server actions** in `src/server/actions/*.ts`. Every action re-checks
   authorization with `requireAdmin()` — do not add mutations anywhere else, and do not trust
   client-side validation.
2. **The middleware is called `src/proxy.ts`** (Next.js 16 renamed the convention). It gates
   `/admin/*` using only the signed cookie (edge-safe, no DB). It is a *first filter only* —
   `requireAdmin()` in `src/lib/auth.ts` is the authoritative check.
3. **Money is never a float.** `priceCents`/`discountValueCents` are integers (paise). Discount
   maths lives in one module: `src/lib/pricing.ts`. The computed selling price is denormalised
   onto `Product.effectivePriceCents` by `saveProduct` so catalog filtering/sorting stays simple
   typed Prisma queries. If you touch pricing, update that denormalised column.
4. **SQLite has no native enums.** "Enum-like" columns are plain strings validated with zod against
   the arrays in `src/lib/constants.ts` (`AVAILABILITY`, `PRODUCT_STATUS`, `INQUIRY_STATUS`,
   `CURRENCIES`, `SORT_OPTIONS`). Add values there, and in the admin forms, not in the DB.
5. **Image serving:** uploads under `UPLOAD_DIR` are served through `src/app/media/[...key]/route.ts`
   after passing through `resolveKey()` (refuses `..`, absolute paths, odd characters). Uploaded
   images have UUID names — cache aggressively, never trust client-supplied MIME (magic bytes are
   sniffed in `src/lib/storage.ts`).
6. **Generated types:** `tsconfig.json` includes `.next/types/**` and `.next/dev/types/**`. A
   corrupted `.next` cache can break `tsc --noEmit` with errors in files you never wrote — clear
   `.next` before chasing phantom type errors.
7. **Cross-OS checkouts:** this project may be run from Windows *and* WSL. `prisma/schema.prisma`
   therefore declares `binaryTargets = ["native", "windows"]`. `node_modules` and
   `package-lock.json` are platform-specific (native binaries for Next SWC, Tailwind oxide,
   sharp, Prisma engines) — see [Windows ⇄ WSL](#8-windows--wsl-cross-environment-notes).
8. **Rate limiting is in-process** (`src/lib/rate-limit.ts`): login allows 8 attempts / 10 min / IP,
   inquiries 5 / 10 min / IP. Fine for a single instance; swap for Redis/Upstash on serverless or
   multi-instance hosts.
9. **The site renders a friendly setup notice** (via `databaseReachable()` in `src/lib/db.ts` +
   `SetupNotice`) instead of a stack trace when the DB is missing/unmigrated.
10. **Slug uniqueness** is handled by `uniqueSlug()` in `src/lib/slug.ts` (appends `-2`, `-3`, …).

### Common tasks cookbook

| Task | Where |
| --- | --- |
| Add a product field | `prisma/schema.prisma` → migration (`npx prisma migrate dev --name …`) → `src/lib/validation.ts` → `src/server/actions/products.ts` → `src/components/admin/ProductForm.tsx` → display in `src/components/site/ProductDetailView.tsx` / `ProductCard.tsx` |
| Add a storefront page | `src/app/(site)/<route>/page.tsx` (route group `(site)` shares header/footer layout) |
| Add an admin page | `src/app/admin/(protected)/<route>/page.tsx` + nav entry in `src/components/admin/AdminNav.tsx` |
| Add a server action | `src/server/actions/<domain>.ts`, top of file `"use server"`, first line of handler `await requireAdmin()` |
| Change design tokens | `src/app/globals.css` `@theme` block |
| Change currency/list formatting | `src/lib/format.ts` |
| Change sort/filter behaviour | `src/lib/catalog.ts` + `src/lib/constants.ts` |
| Reset demo data | `bun run db:seed --force` (wipes catalogue **and** resets store details to defaults) |

### Routes

```
/                              Home: hero, highlights, featured pieces, collections, story, visit CTA
/collection                    Catalog: search, category/collection/availability filters, price range,
                               5 sort orders, pagination (9/page)
/furniture/[slug]              Product detail: gallery, price + discount display, dimensions,
                               materials, care, availability, related items, JSON-LD Product/Offer,
                               "Ask about this piece" inquiry form
/about                         Editable story page
/contact                       Address, phone, email, hours, map link, socials + inquiry form
/media/[...key]                Serves uploaded images from UPLOAD_DIR (immutable cache headers)
/robots.txt, /sitemap.xml      Generated by src/app/robots.ts, src/app/sitemap.ts
/admin/login                   Session login (rate limited)
/admin                         Dashboard: draft + inquiry counters
/admin/furniture               Listings: search/filter, publish/unpublish, feature, delete, preview
/admin/furniture/new, /[id]    Create/edit a listing, set discounts, manage images
/admin/furniture/[id]/preview  Live preview of the public page for a draft/edit
/admin/categories              Categories & collections CRUD (delete-guarded when in use)
/admin/settings                Store details: every piece of public copy, contact info, socials, hours
/admin/homepage                Homepage copy: hero, highlights, story, visit section
/admin/inquiries               Inquiry inbox: new/read/resolved, product links
```

---

## 2. Features

### Storefront

- **Home** — hero with headline/lifestyle image, highlights, featured pieces, curated collections,
  brand story and a visit-the-showroom call to action.
- **Collection** — responsive product grid with live search (name, description, materials, SKU),
  category/collection/availability filters, price range, five sort orders and pagination. Price
  filtering and sorting use the **discounted selling price**, so a piece lands where a customer
  expects. Clear empty and loading states.
- **Product detail** — gallery with thumbnails and enlarged view, price, dimensions, materials,
  finish, care instructions, availability, SKU, related products, JSON-LD `Product`/`Offer`
  structured data and an "Ask about this piece" inquiry form. Discounted pieces show the original
  price struck through, the discounted price and the amount saved; the JSON-LD offer carries the
  discounted price. No fake checkout anywhere.
- **About & contact** — editable story page; contact page with address, phone, email, opening
  hours, map link, social links and a validated inquiry form.
- Metadata + Open Graph tags, `sitemap.xml`, `robots.txt`, custom 404/error pages.
- Respectful motion (scroll reveals honour `prefers-reduced-motion`), keyboard navigable,
  focus-visible rings, semantic HTML throughout.

### Admin (`/admin`)

- Session auth (signed JWT cookie via `jose`, bcrypt password hashes, per-IP login rate limiting).
  `/admin/*` is gated by the edge-safe proxy **and** re-authorised server-side on every page and
  mutation.
- Dashboard with draft/inquiry counters.
- **Listings** — search/filter, create/edit, publish/unpublish, feature, delete (with
  confirmation), live preview of the public page, and per-product discounts (percentage or fixed
  rupee amount, with an option to remove).
- **Image manager** — multi-upload (drag & drop), cover selection, reorder, alt text, remove.
  Uploads are validated by magic-byte sniffing and normalised to WebP (max 2400px) with `sharp`.
- **Categories & collections** — full CRUD with delete guards when in use.
- **Store details & Homepage** — every piece of copy on the public site is editable here: hero,
  story, visit section, address, phone, email, map link, opening hours, social links, homepage
  highlights. Street address, second address line, postal code and email are optional: leave them
  blank and they are hidden on the storefront rather than showing placeholder text.
- **Inquiries** — inbox with new/read/resolved states and product links.

---

## 3. Architecture

### Module map (`src/`)

```
proxy.ts                     Edge gate for /admin/* (cookie check only; Next 16 "proxy" convention)
app/
  (site)/                    Public storefront (shared layout: header + footer)
  admin/login/               Login page (outside the protected group)
  admin/(protected)/         All admin pages; layout enforces requireAdmin()
  media/[...key]/route.ts    Streams uploaded images from UPLOAD_DIR
  layout.tsx, error.tsx, not-found.tsx, robots.ts, sitemap.ts
components/
  site/                      Storefront building blocks (header, footer, cards, gallery, forms)
  admin/                     Admin shell, nav, product form, image manager, settings forms
  ui/                        Small primitives: Alert, Badge, EmptyState, Field, Media, Spinner
lib/
  db.ts                      Prisma client singleton + databaseReachable()
  auth.ts                    bcrypt + requireAdmin() (authoritative authorization)
  session-token.ts           jose JWT sign/verify, SESSION_COOKIE, secret validation
  storage.ts                 storeImage / openStoredImage / deleteStoredImageByUrl / resolveKey
  images.ts                  canOptimize / isStoredUpload (which URLs go through the optimiser)
  catalog.ts                 Catalog filters/sorting/pagination queries, facets, related products
  pricing.ts                 Discount maths (single source of truth), safe to import client-side
  settings.ts                Site-wide settings read (getSiteData), ensureSettings, fullAddress
  validation.ts              zod schemas + formDataToObject / fieldErrors helpers
  rate-limit.ts              In-process fixed-window limiter
  slug.ts, format.ts, constants.ts, cn.ts, form-state.ts, admin-copy.ts
server/actions/              ALL mutations ("use server"): auth, products, taxonomy, settings, inquiries
```

### Data flow

- **Reads:** server components call `lib/catalog.ts` / `lib/settings.ts` → Prisma → rendered HTML.
  Catalog filtering/sorting/pagination happen in SQL via `effectivePriceCents`.
- **Writes:** client form → server action (`src/server/actions/*`) → `requireAdmin()` → zod parse
  → Prisma write → `revalidatePath`. Public catalog pages revalidate when products or settings
  change.
- **Auth:** login action verifies bcrypt hash → signs a 7-day HS256 JWT (`an_admin_session`
  cookie, `httpOnly`, `sameSite=lax`) → proxy fast-gates `/admin/*` → every page/action calls
  `requireAdmin()` which re-loads the account from the DB (so deleted/disabled admins lose access
  immediately).
- **Images:** upload action → magic-byte MIME sniff → `sharp` → WebP ≤ 2400px → written to
  `UPLOAD_DIR/products/<uuid>.webp` → `/media/products/<uuid>.webp` served with
  `cache-control: public, max-age=31536000, immutable`.

### Data model (Prisma)

| Model | Purpose | Notes |
| --- | --- | --- |
| `AdminUser` | Admin accounts | `email` unique, `passwordHash` (bcrypt), `lastLoginAt` |
| `Product` | Listings | `priceCents` (list price, paise), `discountType` (`PERCENT`/`AMOUNT`), `discountPercent`, `discountValueCents`, `effectivePriceCents` (denormalised selling price), `status` (`DRAFT`/`PUBLISHED`), `availability` (`IN_STOCK`/`MADE_TO_ORDER`/`PRE_ORDER`/`SOLD_OUT`), `featured`, dimensions, materials, finish, care, SKU |
| `ProductImage` | Product photos | Ordered by position, `isCover` flag, `alt` text, `url` |
| `Category` / `Collection` | Taxonomy | Slugged, positioned, optional `blurb`; delete-guarded when products reference them |
| `Inquiry` | Contact/product asks | `kind` (`CONTACT`/`PRODUCT`), `status` (`NEW`/`READ`/`RESOLVED`), optional product link |
| `SiteSettings` | Singleton store config | All public copy: name, tagline, hero, story, visit section, address, phone, email, map link |
| `OpeningHour` | Weekly hours | Weekday + open/close times, Monday-first display order |
| `SocialLink` | Footer socials | Label + URL, positioned |
| `Highlight` | Homepage highlights | Icon/text pairs shown under the hero |

Migrations live in `prisma/migrations` (three at present: initial schema, product discounts +
nullable email, and the `effectivePriceCents` backfill).

### Product discounts

Each product can carry **one** optional discount:

- **Percentage off** — a value between 0 and 100, or
- **Fixed amount off** — an amount in the product's currency (INR here).

Set, edit or remove it in **Admin → Listings → (a listing) → Price & reference**. The server
validates that the value is positive and never exceeds the list price; a percentage above 100% or
a fixed amount larger than the price is rejected, and the selling price is clamped so it can never
go negative. `effectivePriceCents` is written by `saveProduct` on every save; the price filter,
sort and bounds all use it. Products without a discount simply sell at list price.

---

## 4. Getting started

### Requirements

- [Bun](https://bun.sh) 1.1+ **or** Node 20+. The catalogue/admin maintenance scripts
  (`db:seed`, `admin:create`, `photos:*`) invoke TypeScript via `bun run`; on a Node-only machine
  swap those scripts to `npx tsx <file>` (and `npm i -D tsx`) — `dev`, `build`, `start` and
  `typecheck` work with plain npm already.
- No external services: the database is a file and images live on local disk.

### Setup

```bash
cp .env.example .env         # then edit values (see §5)
npm install                  # or: bun install
npx prisma generate
npx prisma migrate deploy    # applies the committed migrations to prisma/dev.db
npx tsx prisma/seed.ts       # demo catalogue (or: bun run db:seed)
npx tsx scripts/create-admin.ts   # admin account from SEED_ADMIN_* in .env
npm run dev                  # http://localhost:3000
```

Sign in at <http://localhost:3000/admin/login>.

**Demo sign-in (local checkout only):** the seeded account is
`studio@ateliernord.test` / `atelier-nord-2026`. **Change this before any real deployment** —
create/update the account with:

```bash
npx tsx scripts/create-admin.ts "studio@ateliernord.test" "a-long-unique-password"
```

The script refuses placeholder-looking passwords ("changeme", "password", …) and passwords under
8 characters. Matching emails are updated, never duplicated.

Seeding is safe to re-run: products are only inserted when the catalogue is empty, and store
settings/categories/collections are created only when missing. `bun run db:seed --force` wipes the
catalogue **and resets the store details to the Rajadhani Furniture defaults** (demo reset).

---

## 5. Configuration (`.env`)

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | `file:./dev.db` (relative to `prisma/`) or a Postgres connection string |
| `AUTH_SECRET` | 32+ random bytes (`openssl rand -base64 32`). **Required in production**; the app refuses placeholder/short values (< 24 chars) and the admin area disables itself with a helpful message |
| `UPLOAD_DIR` | Where uploads are written (`storage/uploads` default). Absolute path on read-only hosts |
| `MAX_UPLOAD_MB` | Per-file upload cap (default 8). Also mirror it in `next.config.ts` → `serverActions.bodySizeLimit` (currently `12mb`) |
| `NEXT_PUBLIC_SITE_URL` | Absolute base URL for metadata, sitemap and share tags |
| `IMAGE_REMOTE_HOSTS` | Comma-separated hosts allowed through the Next image optimiser (admins can paste remote URLs); `*` allows any https host |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` | Only read by `db:seed` / `create-admin` when creating/updating an admin |

`.env.example` ships placeholders only; `.env` is git-ignored and must never be committed.

---

## 6. Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` / `bun run dev` | Dev server at `:3000` |
| `npm run build` / `bun run build` | Production build (Turbopack) |
| `npm run start` / `bun run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `bun run setup` | `prisma generate && prisma migrate deploy && db:seed` |
| `bun run db:push` | Push schema changes **without** a migration (prototyping only) |
| `bun run db:migrate` | Apply migrations (`prisma migrate deploy`) |
| `bun run db:seed` | Seed demo data (`--force` for a full demo reset) |
| `bun run db:studio` | Prisma Studio data browser |
| `bun run admin:create [email] [password] [name]` | Create/update an admin account (defaults from `.env`) |
| `bun run photos:fetch` / `photos:pick` | Sample-photo pipeline that fills `public/samples` |

---

## 7. Image storage

- Uploaded product images are written to `UPLOAD_DIR`
  (`storage/uploads/products/<uuid>.webp` by default) and served through
  `/media/products/<uuid>.webp` with `cache-control: immutable`.
- Keys are validated against traversal (`resolveKey` refuses `..`, absolute paths and unexpected
  characters); MIME is sniffed from file contents, not the client-supplied type.
- To use object storage instead, reimplement the three functions in `src/lib/storage.ts`
  (`storeImage`, `openStoredImage`, `deleteStoredImageByUrl`) — e.g. for S3/R2/Vercel Blob — and
  drop the `/media` route. This is exactly what the Vercel deployment path below does.

The seed catalogue ships with real, licence-clear photography committed under `public/samples`
(24 files, ~4.5 MB) plus `credits.json` recording creator, licence and source for each. Replace
them with your own shop photography through the admin image manager at any time.

---

## 8. Windows ⇄ WSL cross-environment notes

This checkout is used from both Windows and WSL against the same drive. Native-binary npm
packages are **platform-specific**, so an install from one side cannot serve the other. Symptoms
and fixes (all verified on this project):

| Symptom | Cause | Fix |
| --- | --- | --- |
| `Prisma Client could not locate the Query Engine for runtime "windows"` (or `… for "debian-openssl-3.0.x"` on the other side) | Client generated for one OS | `prisma/schema.prisma` declares `binaryTargets = ["native", "windows"]`; then `npx prisma generate` from the OS you are using |
| Build fails: `Cannot find module '@tailwindcss/oxide-win32-x64-msvc'` (or the Linux equivalent), or `Cannot find native binding` | `node_modules` / lockfile lacks your platform's optional native deps | Delete `node_modules` **and** `package-lock.json`, reinstall from the OS you are using |
| Rebuild still fails after reinstall | Turbopack's persistent cache in `.next` replays old resolution failures | `rm -rf .next .cache` then build |
| `tsc` errors inside `.next/dev/types/routes.d.ts` | Truncated generated file from an interrupted dev run | `rm -rf .next` then re-run (the file regenerates) |
| `bun: command not found` | Bun not installed on that side | Use npm equivalents (see §4) or install Bun |

Practical rule: keep **one** `node_modules` per OS is impossible in the same directory —
reinstall when switching sides, and commit the lockfile from whichever OS the team standardises
on. (If both sides must work simultaneously, prefer running the dev server in WSL and browsing
from Windows.)

---

## 9. Troubleshooting quick reference

- **`next start` binds an unexpected port** (e.g. `http://localhost:61968`): the sandbox/terminal
  wrapper remapped it. Read the actual URL from the server log (`✓ Ready … Local: …`) or force one
  with `npx next start -p 3000`.
- **Admin login says credentials are wrong** although `.env` looks right: the DB hash is the truth.
  Verify/update with `npx tsx scripts/create-admin.ts "<email>" "<new password>"` (upserts).
- **"Set AUTH_SECRET" banner in the admin area:** the secret is missing, still a placeholder, or
  shorter than 24 chars. Generate: `openssl rand -base64 32`.
- **Upload fails on a read-only filesystem:** point `UPLOAD_DIR` at a writable absolute path.
- **Server Action body too large:** `next.config.ts` → `experimental.serverActions.bodySizeLimit`
  must be ≥ your largest upload (`MAX_UPLOAD_MB`). On Vercel the hard ceiling is ~4.5 MB per
  request — keep `MAX_UPLOAD_MB` at 4 there and rely on client-side compression.

---

## 10. Deployment

Two supported paths: **Vercel** (fastest, but requires moving the database to Postgres and images
to object storage because serverless filesystems are ephemeral) or **self-hosting on a VPS /
Docker** (runs exactly as-is, including SQLite + local uploads).

### 10.1 What must change for *any* production deployment

Regardless of platform:

1. **Strong `AUTH_SECRET`** — `openssl rand -base64 32`. The app hard-fails closed without one.
2. **Change the demo admin password** (see §4) — the seed credentials are public.
3. **`NEXT_PUBLIC_SITE_URL`** set to the real public URL (drives metadata, sitemap, share tags).
4. **Postgres instead of SQLite** if you deploy on serverless or more than one instance — **the
   schema already targets PostgreSQL** (provider + `directUrl` are configured; the committed
   migration `20260926120000_postgres_init` creates the schema). Just point `DATABASE_URL` and
   `DIRECT_URL` at your Postgres instance. (For a local SQLite sandbox, switch the provider back
   to `"sqlite"` and use `file:./dev.db`.)
5. **Persistent storage for uploads** if the filesystem is ephemeral (Vercel, most containers) —
   set the Supabase Storage variables (§10.2 step 4) or swap the driver in `src/lib/storage.ts`.

### 10.2 Deploying to Vercel (with Supabase)

Vercel runs Next.js 16 natively (Turbopack builds, the `proxy` gate and server actions all work).
What it does **not** give you: a persistent disk. SQLite and `UPLOAD_DIR` live on ephemeral
storage, so this app ships ready for **Supabase Postgres + Supabase Storage** — the datasource is
already Postgres and `src/lib/storage.ts` automatically switches to Supabase Storage when its
credentials are present. Plan ~30 minutes.

**Step 0 — Restore the Supabase project if it is paused.** Free-tier projects pause after a week
of inactivity: Supabase dashboard → the project → *Restore project* (takes a couple of minutes).

**Step 1 — Put the code on GitHub** (Vercel deploys from a repo):

```bash
git init && git add -A && git commit -m "Initial import"
git remote add origin https://github.com/<you>/rajadhani-furniture.git
git push -u origin main
```

**Step 2 — Collect the three Supabase connection values** (dashboard → Project Settings):

| Value | Where | Used for |
| --- | --- | --- |
| **Pooled connection string** | Database → Connection string → *Connection pooling* (port **6543**) — append `&pgbouncer=true` | `DATABASE_URL` (app runtime) |
| **Direct connection string** | Database → Connection string → *Direct connection* (port **5432**) | `DIRECT_URL` (migrations) |
| **Project URL + service_role key** | API → *Project URL*, *service_role* secret | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (image uploads) |

**Step 3 — Migrate + seed the cloud database from your machine** (fill the values into `.env`):

```bash
npx prisma migrate deploy            # applies prisma/migrations to Supabase Postgres
npx tsx prisma/seed.ts               # optional demo catalogue
npx tsx scripts/create-admin.ts "you@yourshop.com" "a-long-unique-password"
```

**Step 4 — Create the Storage bucket** (one-time): Supabase dashboard → Storage → *New bucket* →
name it `media` and mark it **Public** (or let the app's first upload attempt tell you — the
bucket is never created silently).

**Step 5 — Import the repo in Vercel.**

1. Vercel dashboard → *Add New…* → *Project* → import the GitHub repo (framework preset: Next.js,
   build command `npm run build` — leave both untouched). The `postinstall` script already runs
   `prisma generate` on Vercel's builder.
2. Environment variables (Project → Settings → Environment Variables):

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | pooled string (port 6543) + `?pgbouncer=true` |
   | `DIRECT_URL` | direct string (port 5432) |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role secret (**server-side only** — never expose it client-side) |
   | `SUPABASE_STORAGE_BUCKET` | `media` |
   | `AUTH_SECRET` | `openssl rand -base64 32` output |
   | `NEXT_PUBLIC_SITE_URL` | `https://<your-domain>` (or the `*.vercel.app` URL first) |
   | `MAX_UPLOAD_MB` | `4` — Vercel server actions cap at ~4.5 MB regardless of config |
   | `IMAGE_REMOTE_HOSTS` | only if admins paste external image URLs |

   With the Supabase URL + service key set, `storageMode()` flips to `"supabase"`: uploads go to
   the bucket, images are served from `https://<ref>.supabase.co/storage/v1/object/public/media/…`,
   and that host is allow-listed through the image optimiser automatically.
3. Deploy.

**Step 6 — Post-deploy checks.**

- Visit `https://<app>.vercel.app` — homepage renders with seeded/created products.
- `https://<app>.vercel.app/admin/login` — sign in with the account from step 3.
- Upload one product image through the admin image manager and confirm it renders (proves the
  Supabase Storage path end-to-end).
- Submit a contact inquiry and check `/admin/inquiries`.

**Vercel caveats worth knowing**

- **Rate limiting** (`src/lib/rate-limit.ts`) is in-memory per lambda instance — it still blunts
  casual spam but isn't global. For real protection swap the `Map` for Upstash Redis (the call
  signature is designed for exactly that swap).
- **`next.config.ts` → `serverExternalPackages`** already lists `@prisma/client`, `bcryptjs`,
  `sharp`, which is what Vercel's Node runtime needs; no extra config.
- **DB-backed pages are `force-dynamic`** (home, about, contact, sitemap) so a paused Supabase
  project or a DB blip can never break a Vercel build — the request fails loudly at runtime
  instead of failing the deploy.
- **Custom domain:** Vercel → Project → Domains → add domain, then update
  `NEXT_PUBLIC_SITE_URL` and redeploy so metadata/sitemap use the final URL.

### 10.3 Deploying by yourself (VPS — full control, keeps SQLite)

The app is a plain long-running Node server, so any host works. Example: **Ubuntu 22.04/24.04 +
Nginx + systemd**. SQLite and local uploads are fine here — just keep them on persistent disk.

**1. Provision the server**

```bash
ssh root@your-server
apt update && apt -y upgrade
# Node 22:
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt -y install nodejs nginx git
# or install Bun instead: curl -fsSL https://bun.sh/install | bash
adduser --disabled-password --gecos "" rajadhani
```

**2. Deploy the code**

```bash
su - rajadhani
git clone https://github.com/<you>/rajadhani-furniture.git app
cd app
npm ci
cp .env.example .env && nano .env
```

Production `.env`:

```env
DATABASE_URL="file:./prod.db"
AUTH_SECRET="<openssl rand -base64 32 output>"
UPLOAD_DIR="/srv/rajadhani/uploads"       # absolute, outside the repo for clean backups
MAX_UPLOAD_MB="8"
NEXT_PUBLIC_SITE_URL="https://rajadhanifurniture.com"
IMAGE_REMOTE_HOSTS=""                     # empty = local uploads only
SEED_ADMIN_EMAIL="you@yourshop.com"
SEED_ADMIN_PASSWORD="<initial password>"  # change after first login
```

**3. Initialise the database and build**

```bash
npx prisma generate
npx prisma migrate deploy
npx tsx prisma/seed.ts                            # optional demo catalogue
npx tsx scripts/create-admin.ts                   # real admin account
npm run build
```

**4. Run it under systemd** — `/etc/systemd/system/rajadhani.service`:

```ini
[Unit]
Description=Rajadhani Furniture showcase
After=network.target

[Service]
User=rajadhani
WorkingDirectory=/home/rajadhani/app
EnvironmentFile=/home/rajadhani/app/.env
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable --now rajadhani
systemctl status rajadhani     # should show "Listening on :3000"
```

**5. Nginx reverse proxy + HTTPS** — `/etc/nginx/sites-available/rajadhani`:

```nginx
server {
    listen 80;
    server_name rajadhanifurniture.com www.rajadhanifurniture.com;

    client_max_body_size 12m;   # match serverActions.bodySizeLimit

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/rajadhani /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
apt -y install certbot python3-certbot-nginx
certbot --nginx -d rajadhanifurniture.com -d www.rajadhanifurniture.com
```

`X-Forwarded-Proto` matters: Next uses it to mark requests secure, and the inquiry/login rate
limiter keys off the real client IP passed through `X-Forwarded-For`.

**6. Backups (SQLite + uploads are just files)**

```bash
# crontab -e  (as rajadhani) — nightly backup at 03:20
20 3 * * * sqlite3 /home/rajadhani/app/prisma/prod.db ".backup /home/rajadhani/backups/db-$(date +\%F).db" && rsync -a --delete /srv/rajadhani/uploads/ /home/rajadhani/backups/uploads/
```

(Install `sqlite3`; or stop-copy-start for a guarantee-consistent snapshot. Postgres users:
`pg_dump` nightly instead.)

**7. Updating later**

```bash
su - rajadhani && cd ~/app
git pull
npm ci
npx prisma migrate deploy
npm run build
sudo systemctl restart rajadhani
```

### 10.4 Deploying by yourself (Docker)

A minimal multi-stage image:

```dockerfile
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci && npx prisma generate

FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-slim AS run
WORKDIR /app
ENV NODE_ENV=production PORT=3000 UPLOAD_DIR=/data/uploads
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app ./
EXPOSE 3000
VOLUME /data
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
```

`docker-compose.yml` keeps the DB and uploads persistent:

```yaml
services:
  web:
    build: .
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: file:/data/prod.db
      AUTH_SECRET: ${AUTH_SECRET}
      UPLOAD_DIR: /data/uploads
      NEXT_PUBLIC_SITE_URL: ${NEXT_PUBLIC_SITE_URL}
    volumes:
      - rajadhani-data:/data
volumes:
  rajadhani-data:
```

(`docker compose up -d --build`; put Nginx/Caddy in front for TLS as in §10.3 step 5.)

### 10.5 One-click-ish platforms (Fly.io, Railway, Render)

All three run the same Node server; the only requirement is a **persistent volume** for
`prisma/*.db` and `UPLOAD_DIR` (or switch to Postgres + object storage as in §10.2):

- **Fly.io:** `fly launch` (detects Next.js), `fly volumes create data --size 3`, mount it at
  `/data` in `fly.toml`, set `DATABASE_URL=file:/data/prod.db`, `fly secrets set AUTH_SECRET=…`,
  deploy. Migrations run on release: add `"release": "prisma migrate deploy"` to `package.json`.
- **Railway/Render:** create a Postgres plugin, set env vars, add a volume for uploads (Railway)
  or use their Blob/S3 add-ons; build `npm run build`, start `npm run start`.

---

## 11. Security notes

- All writes go through server actions validated with zod; nothing relies on client-side checks.
- Every admin page and action re-authorises via `requireAdmin()` (DB-backed) on top of the cookie
  gate in `proxy.ts`; sessions are HS256 JWTs in `httpOnly`, `sameSite=lax` cookies, 7-day expiry.
- Login and inquiry endpoints are rate-limited per IP (8 / 10 min and 5 / 10 min).
- Uploads: magic-byte MIME sniffing, size cap, traversal-safe key resolution, `nosniff` and
  immutable cache headers on serving.
- Destructive admin actions (delete listing/category/image) ask for confirmation in the UI.
- `AUTH_SECRET` and `.env` never leave the machine; the app refuses to run the admin area with
  placeholder or short secrets.
