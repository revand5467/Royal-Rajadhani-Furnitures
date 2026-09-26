import type { Metadata } from "next";
import { ArrowUpRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { InquiryForm } from "@/components/site/InquiryForm";
import { getSiteData, fullAddress } from "@/lib/settings";
import { formatOpeningRange } from "@/lib/format";
import { WEEKDAYS, WEEKDAY_ORDER } from "@/lib/constants";

// Content is DB-backed; render on demand so builds never need the database.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Visit & contact",
  description:
    "Visit Rajadhani Furniture in Vattiyoorkavu, Kerala. Call the shop on 080863 80205 or send an inquiry about a piece and we will reply.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const site = await getSiteData();
  const { settings, openingHours } = site;
  const addressLines = fullAddress(settings);
  const hours = [...openingHours].sort(
    (a, b) => WEEKDAY_ORDER.indexOf(a.dayOfWeek) - WEEKDAY_ORDER.indexOf(b.dayOfWeek),
  );
  // Opening hours are optional; hide the block until the shop sets real ones.
  const showHours = openingHours.some((hour) => !hour.closed && hour.opens && hour.closes);

  return (
    <div className="container-page py-12 lg:py-16">
      <header className="max-w-3xl">
        <p className="eyebrow">Visit &amp; contact</p>
        <h1 className="mt-4 font-display text-4xl text-ink-950 sm:text-5xl">{settings.visitHeading}</h1>
        <p className="mt-5 text-base leading-relaxed text-ink-600">{settings.visitBody}</p>
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <dl className="divide-y divide-sand-200 border-y border-sand-200">
            <div className="py-5">
              <dt className="eyebrow flex items-center gap-2">
                <MapPin aria-hidden className="size-3.5" strokeWidth={1.75} />
                Showroom
              </dt>
              <dd className="mt-3 text-sm leading-relaxed text-ink-700">
                <address className="not-italic">
                  {addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
                {settings.mapUrl ? (
                  <a
                    href={settings.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-sm text-ink-800 underline decoration-sand-400 underline-offset-4 hover:text-clay-700"
                  >
                    Open in maps
                    <ArrowUpRight aria-hidden className="size-3.5" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                ) : null}
              </dd>
            </div>

            <div className="py-5">
              <dt className="eyebrow flex items-center gap-2">
                <Phone aria-hidden className="size-3.5" strokeWidth={1.75} />
                Telephone &amp; email
              </dt>
              <dd className="mt-3 space-y-1 text-sm text-ink-700">
                <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`} className="flex items-center gap-2 hover:text-clay-700">
                  <Phone aria-hidden className="size-4 text-ink-500" strokeWidth={1.5} />
                  {settings.phone}
                </a>
                {settings.email ? (
                  <a href={`mailto:${settings.email}`} className="flex items-center gap-2 hover:text-clay-700">
                    <Mail aria-hidden className="size-4 text-ink-500" strokeWidth={1.5} />
                    {settings.email}
                  </a>
                ) : null}
              </dd>
            </div>

            {showHours ? (
              <div className="py-5">
                <dt className="eyebrow flex items-center gap-2">
                  <Clock aria-hidden className="size-3.5" strokeWidth={1.75} />
                  Opening hours
                </dt>
                <dd className="mt-3">
                  <dl className="space-y-1.5 text-sm">
                    {hours.map((hour) => (
                      <div key={hour.dayOfWeek} className="flex justify-between gap-6">
                        <dt className="text-ink-500">{WEEKDAYS[hour.dayOfWeek]}</dt>
                        <dd className="text-ink-800">{formatOpeningRange(hour.opens, hour.closes, hour.closed)}</dd>
                      </div>
                    ))}
                  </dl>
                </dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-8 border border-sand-200 bg-sand-100 p-6 text-sm leading-relaxed text-ink-600">
            <h2 className="font-display text-lg text-ink-950">Before you visit</h2>
            <p className="mt-2">
              The showroom shares a building with the workshop, so pieces move around. If you are coming for something
              specific, send a note first and we will have it out for you — and put the kettle on.
            </p>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="border border-sand-200 bg-white p-6 sm:p-10">
            <h2 className="font-display text-2xl text-ink-950">Send an inquiry</h2>
            <p className="mt-3 mb-8 text-sm leading-relaxed text-ink-600">
              Commissions, lead times, dimensions, finishes — ask anything. Fields marked with an asterisk are required.
            </p>
            <InquiryForm sourcePath="/contact" storeEmail={settings.email} storePhone={settings.phone} />
          </div>
        </div>
      </div>
    </div>
  );
}
