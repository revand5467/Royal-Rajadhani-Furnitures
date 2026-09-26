import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone, Search } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { InquiryStatusBadge } from "@/components/ui/Badge";
import { Pagination } from "@/components/site/Pagination";
import { prisma } from "@/lib/db";
import { deleteInquiry, setInquiryStatus } from "@/server/actions/inquiries";
import { formatDateTime, formatRelative } from "@/lib/format";
import { ADMIN_PAGE_SIZE, INQUIRY_STATUS } from "@/lib/constants";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Inquiries" };

type PageProps = {
  searchParams: Promise<{ status?: string; q?: string; page?: string; focus?: string }>;
};

export default async function AdminInquiriesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = (INQUIRY_STATUS as readonly string[]).includes(params.status ?? "") ? params.status! : "";
  const q = (params.q ?? "").slice(0, 120);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
            { message: { contains: q } },
            { subject: { contains: q } },
          ],
        }
      : {}),
  };

  const [total, inquiries, counts] = await Promise.all([
    prisma.inquiry.count({ where }),
    prisma.inquiry.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: { product: { select: { id: true, name: true, slug: true, status: true } } },
    }),
    prisma.inquiry.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countFor = (value: string) => counts.find((entry) => entry.status === value)?._count._all ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));

  return (
    <>
      <AdminPageHeader
        eyebrow="Inbox"
        title="Inquiries"
        description="Messages from the contact form and from each piece’s “Ask about this piece” form. Mark them as you work through them."
      />

      <div className="mb-8 flex flex-wrap items-center gap-2">
        <Link
          href="/admin/inquiries"
          className={cn(
            "border px-3 py-1.5 text-xs tracking-[0.08em] uppercase",
            !status ? "border-ink-950 bg-ink-950 text-sand-50" : "border-sand-300 text-ink-700 hover:border-ink-700",
          )}
        >
          All ({counts.reduce((sum, entry) => sum + entry._count._all, 0)})
        </Link>
        {INQUIRY_STATUS.map((value) => (
          <Link
            key={value}
            href={`/admin/inquiries?status=${value}`}
            className={cn(
              "border px-3 py-1.5 text-xs tracking-[0.08em] uppercase",
              status === value
                ? "border-ink-950 bg-ink-950 text-sand-50"
                : "border-sand-300 text-ink-700 hover:border-ink-700",
            )}
          >
            {value.charAt(0) + value.slice(1).toLowerCase()} ({countFor(value)})
          </Link>
        ))}
      </div>

      <form action="/admin/inquiries" method="get" role="search" aria-label="Search inquiries" className="mb-8 border border-sand-200 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div>
            <label htmlFor="inquiry-q" className="field-label">
              Search
            </label>
            <div className="relative">
              <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-500" strokeWidth={1.75} />
              <input
                id="inquiry-q"
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Name, email or message text"
                className="field-input pl-9"
              />
            </div>
          </div>
          <div className="flex gap-3">
            {status ? <input type="hidden" name="status" value={status} /> : null}
            <button type="submit" className="btn btn-secondary">
              Search
            </button>
            {q || status ? (
              <Link href="/admin/inquiries" className="btn btn-quiet">
                Reset
              </Link>
            ) : null}
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-500" role="status">
          {total} message{total === 1 ? "" : "s"} shown.
        </p>
      </form>

      {inquiries.length === 0 ? (
        <EmptyState
          title={q || status ? "No messages match" : "No inquiries yet"}
          action={
            q || status ? (
              <Link href="/admin/inquiries" className="btn btn-secondary">
                Clear filters
              </Link>
            ) : undefined
          }
        >
          <p>
            {q || status
              ? "Try a different search term or clear the status filter."
              : "When a visitor sends a message from the storefront it appears here straight away."}
          </p>
        </EmptyState>
      ) : (
        <ul className="space-y-4">
          {inquiries.map((inquiry) => (
            <li
              key={inquiry.id}
              className={cn(
                "border bg-white p-5",
                params.focus === inquiry.id ? "border-ink-900 ring-1 ring-ink-900" : "border-sand-200",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-lg text-ink-950">{inquiry.name}</span>
                    <InquiryStatusBadge value={inquiry.status} />
                    <span className="bg-sand-200 px-2 py-0.5 text-[0.6875rem] tracking-[0.1em] text-ink-600 uppercase">
                      {inquiry.kind === "PRODUCT" ? "Product inquiry" : "Contact"}
                    </span>
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-600">
                    <a href={`mailto:${inquiry.email}`} className="inline-flex items-center gap-1.5 hover:text-clay-700">
                      <Mail aria-hidden className="size-3.5" strokeWidth={1.75} />
                      {inquiry.email}
                    </a>
                    {inquiry.phone ? (
                      <a href={`tel:${inquiry.phone.replace(/[^+\d]/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-clay-700">
                        <Phone aria-hidden className="size-3.5" strokeWidth={1.75} />
                        {inquiry.phone}
                      </a>
                    ) : null}
                    <span title={formatDateTime(inquiry.createdAt)}>{formatRelative(inquiry.createdAt)}</span>
                  </p>
                  {inquiry.subject ? <p className="mt-3 text-sm font-medium text-ink-800">{inquiry.subject}</p> : null}
                </div>

                {inquiry.product ? (
                  <Link
                    href={`/admin/furniture/${inquiry.product.id}`}
                    className="text-xs text-ink-700 underline underline-offset-4 hover:text-clay-700"
                  >
                    About {inquiry.product.name}
                  </Link>
                ) : null}
              </div>

              <p className="mt-4 border-l-2 border-sand-300 pl-4 text-sm leading-relaxed whitespace-pre-line text-ink-700">
                {inquiry.message}
              </p>

              {inquiry.sourcePath ? (
                <p className="mt-3 text-xs text-ink-500">Sent from {inquiry.sourcePath}</p>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-sand-200 pt-4">
                {INQUIRY_STATUS.filter((value) => value !== inquiry.status).map((value) => (
                  <form action={setInquiryStatus} key={value}>
                    <input type="hidden" name="id" value={inquiry.id} />
                    <input type="hidden" name="status" value={value} />
                    <button type="submit" className="btn btn-quiet">
                      Mark as {value.toLowerCase()}
                    </button>
                  </form>
                ))}

                <form action={deleteInquiry} className="ml-auto">
                  <input type="hidden" name="id" value={inquiry.id} />
                  <ConfirmSubmit question={`Delete the message from ${inquiry.name}?`} confirmLabel="Delete message">
                    Delete
                  </ConfirmSubmit>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={page}
        pageCount={pageCount}
        total={total}
        pageSize={ADMIN_PAGE_SIZE}
        params={{ q, status }}
        basePath="/admin/inquiries"
      />

      <Alert tone="info" className="mt-10" title="Where replies go">
        <p>
          The site does not send email itself — open the visitor’s address or call them. To add notifications, wire
          <code className="mx-1">submitInquiry</code> in <code>src/server/actions/inquiries.ts</code> to your provider
          of choice (for example Resend or Postmark) and document the API key in <code>.env</code>.
        </p>
      </Alert>
    </>
  );
}
