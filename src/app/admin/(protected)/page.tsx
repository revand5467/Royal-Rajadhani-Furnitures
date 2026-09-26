import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Mail, Plus, Sofa, Sparkles } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { InquiryStatusBadge, StatusBadge } from "@/components/ui/Badge";
import { Media } from "@/components/ui/Media";
import { prisma } from "@/lib/db";
import { getSiteData } from "@/lib/settings";
import { formatPrice, formatRelative } from "@/lib/format";
import { effectivePriceCents, hasDiscount } from "@/lib/pricing";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const [
    published,
    drafts,
    featured,
    newInquiries,
    totalInquiries,
    recentInquiries,
    recentProducts,
    withoutImages,
    publishedWithoutAlt,
    categories,
    site,
  ] = await Promise.all([
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.product.count({ where: { status: "DRAFT" } }),
    prisma.product.count({ where: { status: "PUBLISHED", featured: true } }),
    prisma.inquiry.count({ where: { status: "NEW" } }),
    prisma.inquiry.count(),
    prisma.inquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { product: { select: { name: true, id: true } } },
    }),
    prisma.product.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        category: { select: { name: true } },
        images: { orderBy: [{ isCover: "desc" }, { position: "asc" }], take: 1 },
      },
    }),
    prisma.product.findMany({
      where: { images: { none: {} } },
      select: { id: true, name: true, status: true },
      take: 5,
    }),
    prisma.product.findMany({
      where: { status: "PUBLISHED", images: { some: { alt: "" } } },
      select: { id: true, name: true },
      take: 5,
    }),
    prisma.category.count(),
    getSiteData(),
  ]);

  const stats = [
    { label: "Published", value: published, href: "/admin/furniture?status=PUBLISHED", Icon: Sofa },
    { label: "Drafts", value: drafts, href: "/admin/furniture?status=DRAFT", Icon: Sofa },
    { label: "Featured", value: featured, href: "/admin/furniture", Icon: Sparkles },
    { label: "New inquiries", value: newInquiries, href: "/admin/inquiries?status=NEW", Icon: Mail },
  ];

  const tasks: Array<{ tone: "warning" | "info"; title: string; body: React.ReactNode }> = [];
  if (withoutImages.length) {
    tasks.push({
      tone: "warning",
      title: `${withoutImages.length} listing${withoutImages.length === 1 ? "" : "s"} without photography`,
      body: (
        <p>
          {withoutImages.map((product) => product.name).join(", ")} — cards look blank until an image is uploaded, and
          published pieces without images are hidden from nothing but look unfinished.{" "}
          <Link href="/admin/furniture" className="underline underline-offset-4">
            Open listings
          </Link>
          .
        </p>
      ),
    });
  }
  if (publishedWithoutAlt.length) {
    tasks.push({
      tone: "warning",
      title: "Missing alt text",
      body: (
        <p>
          Some published images have no description, which hurts screen-reader users and search visibility.{" "}
          <Link href="/admin/furniture" className="underline underline-offset-4">
            Fix alt text
          </Link>
          .
        </p>
      ),
    });
  }
  if (!categories) {
    tasks.push({
      tone: "warning",
      title: "No categories yet",
      body: (
        <p>
          Create at least one category before adding listings.{" "}
          <Link href="/admin/categories" className="underline underline-offset-4">
            Manage categories
          </Link>
          .
        </p>
      ),
    });
  }
  if (!site.ready) {
    tasks.push({
      tone: "warning",
      title: "Store details are using defaults",
      body: (
        <p>
          <Link href="/admin/settings" className="underline underline-offset-4">
            Add your real address, phone and opening hours
          </Link>{" "}
          so the storefront does not show placeholder contact details.
        </p>
      ),
    });
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Studio admin"
        title="Dashboard"
        description="Listings, photography and inquiries in one place. Published pieces appear on the storefront immediately."
        actions={
          <>
            <Link href="/admin/furniture/new" className="btn btn-primary">
              <Plus aria-hidden className="size-4" strokeWidth={1.75} />
              New listing
            </Link>
            <Link href="/admin/inquiries" className="btn btn-secondary">
              Inbox
            </Link>
          </>
        }
      />

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <li key={stat.label}>
            <Link
              href={stat.href}
              className="group flex items-start justify-between border border-sand-200 bg-white p-5 transition-colors hover:border-ink-700"
            >
              <span>
                <span className="eyebrow">{stat.label}</span>
                <span className="mt-2 block font-display text-3xl text-ink-950 tabular-nums">{stat.value}</span>
              </span>
              <stat.Icon aria-hidden className="size-5 text-ink-500 transition-colors group-hover:text-clay-600" strokeWidth={1.5} />
            </Link>
          </li>
        ))}
      </ul>

      {tasks.length ? (
        <section className="mt-10 space-y-3" aria-labelledby="tasks-heading">
          <h2 id="tasks-heading" className="font-display text-xl text-ink-950">
            Worth a look
          </h2>
          {tasks.map((task) => (
            <Alert key={task.title} tone={task.tone} title={task.title}>
              {task.body}
            </Alert>
          ))}
        </section>
      ) : (
        <section className="mt-10">
          <Alert tone="success" title="Everything looks tidy">
            {published} published listing{published === 1 ? "" : "s"}, {totalInquiries} inquir
            {totalInquiries === 1 ? "y" : "ies"} on file, and no outstanding housekeeping.
          </Alert>
        </section>
      )}

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="recent-inquiries-heading">
          <div className="flex items-center justify-between gap-4">
            <h2 id="recent-inquiries-heading" className="font-display text-xl text-ink-950">
              Latest inquiries
            </h2>
            <Link href="/admin/inquiries" className="inline-flex items-center gap-1 text-sm text-ink-700 hover:text-clay-700">
              All inquiries
              <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          </div>

          <div className="mt-5">
            {recentInquiries.length ? (
              <ul className="divide-y divide-sand-200 border border-sand-200 bg-white">
                {recentInquiries.map((inquiry) => (
                  <li key={inquiry.id} className="flex items-start justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink-950">
                        {inquiry.name}
                        <InquiryStatusBadge value={inquiry.status} />
                      </p>
                      <p className="mt-1 truncate text-xs text-ink-500">
                        {inquiry.product ? `About ${inquiry.product.name} · ` : ""}
                        {formatRelative(inquiry.createdAt)}
                      </p>
                      <p className="mt-1.5 line-clamp-2 text-sm text-ink-600">{inquiry.message}</p>
                    </div>
                    <Link
                      href={`/admin/inquiries?focus=${inquiry.id}`}
                      className="shrink-0 text-xs text-ink-700 underline underline-offset-4 hover:text-clay-700"
                    >
                      Open
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No inquiries yet" compact>
                <p>Messages sent from the contact and product pages land here with a new/read/resolved status.</p>
              </EmptyState>
            )}
          </div>
        </section>

        <section aria-labelledby="recent-listings-heading">
          <div className="flex items-center justify-between gap-4">
            <h2 id="recent-listings-heading" className="font-display text-xl text-ink-950">
              Recently updated listings
            </h2>
            <Link href="/admin/furniture" className="inline-flex items-center gap-1 text-sm text-ink-700 hover:text-clay-700">
              All listings
              <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          </div>

          <div className="mt-5">
            {recentProducts.length ? (
              <ul className="divide-y divide-sand-200 border border-sand-200 bg-white">
                {recentProducts.map((product) => (
                  <li key={product.id} className="flex items-center gap-4 p-4">
                    <div className="relative size-14 shrink-0 overflow-hidden bg-sand-200">
                      <Media src={product.images[0]?.url} alt={product.name} sizes="56px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink-950">
                        <Link href={`/admin/furniture/${product.id}`} className="truncate hover:text-clay-700">
                          {product.name}
                        </Link>
                        <StatusBadge value={product.status} />
                      </p>
                      <p className="mt-1 text-xs text-ink-500">
                        {product.category.name} ·{" "}
                        {hasDiscount(product) ? (
                          <>
                            <span className="line-through">{formatPrice(product.priceCents, product.currency)}</span>{" "}
                            <span className="font-medium text-clay-700">
                              {formatPrice(effectivePriceCents(product), product.currency)}
                            </span>
                          </>
                        ) : (
                          formatPrice(product.priceCents, product.currency)
                        )}{" "}
                        · updated {formatRelative(product.updatedAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No listings yet" compact>
                <p>Start with a category, then add your first piece.</p>
              </EmptyState>
            )}
          </div>
        </section>
      </div>

      <section className="mt-12 border border-sand-200 bg-white p-6" aria-labelledby="checklist-heading">
        <h2 id="checklist-heading" className="flex items-center gap-2 font-display text-xl text-ink-950">
          <AlertTriangle aria-hidden className="size-4 text-ink-500" strokeWidth={1.75} />
          Before you go live
        </h2>
        <ol className="mt-5 grid gap-4 text-sm text-ink-600 sm:grid-cols-2">
          <li>
            <strong className="text-ink-900">1. Store details.</strong> Set the real address, phone, email and opening
            hours in <Link href="/admin/settings" className="underline underline-offset-4">Store details</Link>.
          </li>
          <li>
            <strong className="text-ink-900">2. Homepage.</strong> Replace the sample hero and story copy in{" "}
            <Link href="/admin/homepage" className="underline underline-offset-4">Homepage</Link>.
          </li>
          <li>
            <strong className="text-ink-900">3. Photography.</strong> Upload your own images — the bundled samples live
            in <code>public/samples</code> and can be deleted once replaced.
          </li>
          <li>
            <strong className="text-ink-900">4. Secrets.</strong> Set a strong <code>AUTH_SECRET</code> and change the
            seeded admin password before deploying.
          </li>
        </ol>
      </section>
    </>
  );
}
