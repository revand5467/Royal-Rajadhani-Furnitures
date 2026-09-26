import Link from "next/link";
import { ArrowUpRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { fullAddress, type SiteData } from "@/lib/settings";
import { formatOpeningRange } from "@/lib/format";
import { WEEKDAYS, WEEKDAY_ORDER } from "@/lib/constants";

export function SiteFooter({ site }: { site: SiteData }) {
  const { settings, openingHours, socialLinks } = site;
  const addressLines = fullAddress(settings);
  const hours = [...openingHours].sort(
    (a, b) => WEEKDAY_ORDER.indexOf(a.dayOfWeek) - WEEKDAY_ORDER.indexOf(b.dayOfWeek),
  );
  // Opening hours stay hidden until the shop publishes at least one open day.
  const showHours = openingHours.some((hour) => !hour.closed && hour.opens && hour.closes);

  return (
    <footer className="mt-24 border-t border-sand-200 bg-sand-100">
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        <div className="lg:col-span-2 lg:max-w-sm">
          <p className="font-display text-xl text-ink-950">{settings.storeName}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-600">{settings.footerBlurb}</p>
          {socialLinks.length ? (
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              {socialLinks.map((link) => (
                <li key={`${link.platform}-${link.url}`}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="inline-flex items-center gap-1 text-sm text-ink-700 underline decoration-sand-400 underline-offset-4 hover:text-clay-700"
                  >
                    {link.platform}
                    <ArrowUpRight aria-hidden className="size-3.5" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div>
          <h2 className="eyebrow">Visit</h2>
          <address className="mt-4 space-y-1 text-sm not-italic leading-relaxed text-ink-700">
            <span className="flex gap-2">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-500" strokeWidth={1.5} />
              <span>
                {addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
            </span>
          </address>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`} className="flex gap-2 text-ink-700 hover:text-clay-700">
                <Phone aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-500" strokeWidth={1.5} />
                {settings.phone}
              </a>
            </li>
            {settings.email ? (
              <li>
                <a href={`mailto:${settings.email}`} className="flex gap-2 text-ink-700 hover:text-clay-700">
                  <Mail aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-500" strokeWidth={1.5} />
                  {settings.email}
                </a>
              </li>
            ) : null}
          </ul>
          {settings.mapUrl ? (
            <p className="mt-4">
              <a
                href={settings.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-ink-700 underline decoration-sand-400 underline-offset-4 hover:text-clay-700"
              >
                Open in maps
                <ArrowUpRight aria-hidden className="size-3.5" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </p>
          ) : null}
        </div>

        {showHours ? (
          <div>
            <h2 className="eyebrow">Opening hours</h2>
            <dl className="mt-4 space-y-1.5 text-sm">
              {hours.map((hour) => (
                <div key={hour.dayOfWeek} className="flex justify-between gap-4">
                  <dt className="text-ink-600">{WEEKDAYS[hour.dayOfWeek]}</dt>
                  <dd className="text-ink-800">{formatOpeningRange(hour.opens, hour.closes, hour.closed)}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 flex items-center gap-2 text-xs text-ink-500">
              <Clock aria-hidden className="size-3.5" strokeWidth={1.5} />
              Closed on public holidays
            </p>
          </div>
        ) : null}
      </div>

      <div className="border-t border-sand-200">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {settings.storeName}. Furniture shown in the showroom and made to order — we
            do not sell online.
          </p>
          <nav aria-label="Footer" className="flex items-center gap-5">
            <Link href="/collection" className="hover:text-ink-800">
              Collection
            </Link>
            <Link href="/contact" className="hover:text-ink-800">
              Contact
            </Link>
            <Link href="/admin" className="hover:text-ink-800">
              Admin login
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
