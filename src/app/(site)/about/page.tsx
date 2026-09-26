import type { Metadata } from "next";
import Link from "next/link";
import { Media } from "@/components/ui/Media";
import { getSiteData, fullAddress } from "@/lib/settings";

// Content is DB-backed; render on demand so builds never need the database.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Rajadhani Furniture is a furniture shop in Vattiyoorkavu, Kerala, offering solid teak, mango wood and rosewood furniture for Indian homes.",
  alternates: { canonical: "/about" },
};

const FACTS = [
  { term: "Where we are", value: "Vattiyoorkavu, Kerala, India" },
  { term: "Materials", value: "Solid teak, mango wood and rosewood" },
  { term: "What we make", value: "Sofas, dining tables, wardrobes, storage and more" },
  { term: "Buying", value: "Visit the showroom or call the shop on 080863 80205" },
];

export default async function AboutPage() {
  const site = await getSiteData();
  const { settings, highlights } = site;
  const addressLines = fullAddress(settings);

  return (
    <div className="container-page py-12 lg:py-16">
      <header className="max-w-3xl">
        <p className="eyebrow">Our story</p>
        <h1 className="mt-4 font-display text-4xl text-ink-950 sm:text-5xl">{settings.storyHeading}</h1>
      </header>

      <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <div className="relative aspect-4/3 w-full overflow-hidden bg-sand-200">
            <Media
              src={settings.storyImageUrl}
              alt={settings.storyImageAlt ?? "Inside the Rajadhani Furniture showroom"}
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
            />
          </div>

          <div className="prose-editorial mt-10 space-y-5 text-base leading-relaxed text-ink-700">
            {settings.storyBody.split("\n").filter(Boolean).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>

        <aside className="lg:col-span-5">
          <dl className="divide-y divide-sand-200 border-t border-sand-200">
            {FACTS.map((fact) => (
              <div key={fact.term} className="py-4">
                <dt className="eyebrow">{fact.term}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink-700">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 border border-sand-200 bg-sand-100 p-6">
            <h2 className="font-display text-xl text-ink-950">Find us</h2>
            <address className="mt-3 space-y-0.5 text-sm not-italic leading-relaxed text-ink-700">
              {addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            <p className="mt-4 text-sm text-ink-600">
              <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`} className="hover:text-clay-700">
                {settings.phone}
              </a>
              {settings.email ? (
                <>
                  <span className="mx-2 text-sand-400" aria-hidden>
                    ·
                  </span>
                  <a href={`mailto:${settings.email}`} className="hover:text-clay-700">
                    {settings.email}
                  </a>
                </>
              ) : null}
            </p>
            <p className="mt-5">
              <Link href="/contact" className="btn btn-secondary">
                Opening hours &amp; directions
              </Link>
            </p>
          </div>
        </aside>
      </div>

      {highlights.length ? (
        <section className="mt-16 border-t border-sand-200 pt-14" aria-labelledby="values-heading">
          <h2 id="values-heading" className="font-display text-3xl text-ink-950">
            What we hold to
          </h2>
          <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((highlight) => (
              <li key={highlight.title} className="border-t border-sand-300 pt-5">
                <h3 className="font-display text-lg text-ink-950">{highlight.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{highlight.body}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-16 border-t border-sand-200 pt-14" aria-labelledby="about-cta-heading">
        <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <h2 id="about-cta-heading" className="font-display text-2xl text-ink-950">
              {settings.visitHeading}
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-600">{settings.visitBody}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/collection" className="btn btn-primary">
              Explore collection
            </Link>
            <Link href="/contact" className="btn btn-secondary">
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
