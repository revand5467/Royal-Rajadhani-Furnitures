import Link from "next/link";
import { ArrowRight, Clock, MapPin, Phone } from "lucide-react";
import { ProductCard } from "@/components/site/ProductCard";
import { Media } from "@/components/ui/Media";
import { EmptyState } from "@/components/ui/EmptyState";
import { getFeaturedCollections, getFeaturedProducts } from "@/lib/catalog";
import { fullAddress, getSiteData } from "@/lib/settings";
import { formatOpeningRange } from "@/lib/format";
import { WEEKDAYS, WEEKDAY_ORDER } from "@/lib/constants";

export default async function HomePage() {
  const [site, featured, collections] = await Promise.all([
    getSiteData(),
    getFeaturedProducts(6),
    getFeaturedCollections(3),
  ]);
  const { settings, openingHours, highlights } = site;

  const hours = [...openingHours].sort(
    (a, b) => WEEKDAY_ORDER.indexOf(a.dayOfWeek) - WEEKDAY_ORDER.indexOf(b.dayOfWeek),
  );
  const addressLines = fullAddress(settings);
  // Keep the opening-hours band hidden until at least one open day is set.
  const showHours = openingHours.some((hour) => !hour.closed && hour.opens && hour.closes);

  return (
    <>
      {/* Hero ------------------------------------------------------------------ */}
      <section className="container-page grid items-center gap-10 py-12 lg:grid-cols-12 lg:gap-16 lg:py-20">
        <div className="lg:col-span-5">
          <p className="eyebrow reveal">{settings.tagline}</p>
          <h1 className="reveal mt-5 font-display text-4xl leading-[1.05] text-ink-950 sm:text-5xl lg:text-6xl">
            {settings.heroHeadline}
          </h1>
          <p className="reveal mt-6 max-w-lg text-base leading-relaxed text-ink-600">{settings.heroSubhead}</p>
          <div className="reveal mt-9 flex flex-wrap items-center gap-3">
            <Link href="/collection" className="btn btn-primary">
              Explore collection
              <ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />
            </Link>
            <Link href="/contact" className="btn btn-secondary">
              Visit the showroom
            </Link>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="relative aspect-4/3 w-full overflow-hidden bg-sand-200 lg:aspect-5/4">
            <Media
              src={settings.heroImageUrl}
              alt={settings.heroImageAlt ?? "Interior with furniture from the collection"}
              priority
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="reveal"
            />
          </div>
        </div>
      </section>

      {/* Highlights ----------------------------------------------------------- */}
      {highlights.length ? (
        <section aria-label="Why shop with us" className="container-page py-14">
          <ul className="grid gap-8 border-y border-sand-200 py-10 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((highlight) => (
              <li key={highlight.title}>
                <h2 className="font-display text-lg text-ink-950">{highlight.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{highlight.body}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Featured furniture --------------------------------------------------- */}
      <section className="container-page py-10 lg:py-14" aria-labelledby="featured-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Selected pieces</p>
            <h2 id="featured-heading" className="mt-3 font-display text-3xl text-ink-950 sm:text-4xl">
              Featured furniture
            </h2>
          </div>
          <Link
            href="/collection"
            className="inline-flex items-center gap-2 text-sm text-ink-700 underline decoration-sand-400 underline-offset-4 hover:text-clay-700"
          >
            View the full collection
            <ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />
          </Link>
        </div>

        <div className="mt-10">
          {featured.length ? (
            <ul className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 3} />
              ))}
            </ul>
          ) : (
            <EmptyState title="The collection is being photographed">
              <p>
                Pieces are listed as the workshop finishes them. In the meantime,{" "}
                <Link href="/contact" className="underline underline-offset-4">
                  get in touch
                </Link>{" "}
                and we will send the current lookbook.
              </p>
            </EmptyState>
          )}
        </div>
      </section>

      {/* Curated collections -------------------------------------------------- */}
      {collections.length ? (
        <section className="container-page py-10 lg:py-14" aria-labelledby="collections-heading">
          <p className="eyebrow">Curated</p>
          <h2 id="collections-heading" className="mt-3 font-display text-3xl text-ink-950 sm:text-4xl">
            Collections
          </h2>
          <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <li key={collection.id}>
                <Link href={`/collection?collection=${collection.slug}`} className="group block">
                  <div className="relative aspect-3/2 w-full overflow-hidden bg-sand-200">
                    <Media
                      src={collection.products[0]?.images[0]?.url}
                      alt={collection.products[0]?.images[0]?.alt ?? `${collection.name} collection`}
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                      imageClassName="transition-transform duration-700 ease-out group-hover:scale-[1.035] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    />
                  </div>
                  <h3 className="mt-4 font-display text-xl text-ink-950">{collection.name}</h3>
                  <p className="mt-1 text-sm text-ink-600">
                    {collection._count.products} piece{collection._count.products === 1 ? "" : "s"}
                    {collection.blurb ? ` · ${collection.blurb}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Brand story ---------------------------------------------------------- */}
      <section className="mt-8 bg-olive-100/50 py-16 lg:py-24" aria-labelledby="story-heading">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-4/3 w-full overflow-hidden bg-sand-200">
            <Media
              src={settings.storyImageUrl}
              alt={settings.storyImageAlt ?? "Inside the workshop"}
              sizes="(min-width: 1024px) 46vw, 100vw"
            />
          </div>
          <div>
            <p className="eyebrow">Our story</p>
            <h2 id="story-heading" className="mt-3 font-display text-3xl text-ink-950 sm:text-4xl">
              {settings.storyHeading}
            </h2>
            <div className="prose-editorial mt-6 space-y-4 text-base leading-relaxed text-ink-700">
              {settings.storyBody.split("\n").filter(Boolean).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            <p className="mt-8">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-sm text-ink-800 underline decoration-sand-400 underline-offset-4 hover:text-clay-700"
              >
                Read more about the workshop
                <ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Visit CTA ------------------------------------------------------------ */}
      <section className="container-page py-16 lg:py-24" aria-labelledby="visit-heading">
        <div className="grid gap-10 border border-sand-200 bg-sand-100 p-8 sm:p-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow">Come and see</p>
            <h2 id="visit-heading" className="mt-3 font-display text-3xl text-ink-950 sm:text-4xl">
              {settings.visitHeading}
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-600">{settings.visitBody}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="btn btn-primary">
                Plan a visit
              </Link>
              {settings.email ? (
                <a href={`mailto:${settings.email}`} className="btn btn-secondary">
                  Email the shop
                </a>
              ) : (
                <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`} className="btn btn-secondary">
                  Call the shop
                </a>
              )}
            </div>
          </div>

          <dl className="grid gap-6 sm:grid-cols-2 lg:content-start">
            <div>
              <dt className="eyebrow flex items-center gap-2">
                <MapPin aria-hidden className="size-3.5" strokeWidth={1.75} />
                Showroom
              </dt>
              <dd className="mt-3 text-sm leading-relaxed text-ink-700">
                {addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </dd>
            </div>
            <div>
              <dt className="eyebrow flex items-center gap-2">
                <Phone aria-hidden className="size-3.5" strokeWidth={1.75} />
                Telephone
              </dt>
              <dd className="mt-3 text-sm text-ink-700">
                <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`} className="hover:text-clay-700">
                  {settings.phone}
                </a>
                {settings.email ? (
                  <span className="mt-1 block">
                    <a href={`mailto:${settings.email}`} className="hover:text-clay-700">
                      {settings.email}
                    </a>
                  </span>
                ) : null}
              </dd>
            </div>
            {showHours ? (
              <div className="sm:col-span-2">
                <dt className="eyebrow flex items-center gap-2">
                  <Clock aria-hidden className="size-3.5" strokeWidth={1.75} />
                  Opening hours
                </dt>
                <dd className="mt-3 grid gap-1 text-sm text-ink-700 sm:grid-cols-2">
                  {hours.map((hour) => (
                    <span key={hour.dayOfWeek} className="flex justify-between gap-4 sm:justify-start sm:gap-3">
                      <span className="text-ink-500">{WEEKDAYS[hour.dayOfWeek]}</span>
                      <span>{formatOpeningRange(hour.opens, hour.closes, hour.closed)}</span>
                    </span>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </section>
    </>
  );
}
