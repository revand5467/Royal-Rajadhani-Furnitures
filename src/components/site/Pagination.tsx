import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

function buildHref(page: number, params: Record<string, string | undefined>, basePath: string) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  else search.delete("page");
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/** Compact pagination: first, last, and a window around the current page. */
function pageWindow(current: number, total: number): Array<number | "gap"> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((page) => pages.add(page));
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((page) => pages.add(page));

  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const output: Array<number | "gap"> = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous && page - previous > 1) output.push("gap");
    output.push(page);
    previous = page;
  }
  return output;
}

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  params,
  basePath = "/collection",
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  params: Record<string, string | undefined>;
  basePath?: string;
}) {
  if (total === 0) return null;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav aria-label="Pagination" className="mt-14 flex flex-col gap-5 border-t border-sand-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-ink-600">
        Showing <span className="tabular-nums text-ink-900">{first}</span>–
        <span className="tabular-nums text-ink-900">{last}</span> of{" "}
        <span className="tabular-nums text-ink-900">{total}</span> pieces
      </p>

      {pageCount > 1 ? (
        <ul className="flex flex-wrap items-center gap-1.5">
          <li>
            <PagerLink
              href={buildHref(Math.max(1, page - 1), params, basePath)}
              disabled={page === 1}
              label="Previous page"
            >
              <ChevronLeft aria-hidden className="size-4" strokeWidth={1.75} />
            </PagerLink>
          </li>

          {pageWindow(page, pageCount).map((entry, index) =>
            entry === "gap" ? (
              <li key={`gap-${index}`} aria-hidden className="px-1.5 text-ink-500">
                …
              </li>
            ) : (
              <li key={entry}>
                <Link
                  href={buildHref(entry, params, basePath)}
                  aria-current={entry === page ? "page" : undefined}
                  aria-label={`Page ${entry}`}
                  className={cn(
                    "grid size-9 place-items-center border text-sm tabular-nums transition-colors",
                    entry === page
                      ? "border-ink-950 bg-ink-950 text-sand-50"
                      : "border-sand-300 text-ink-700 hover:border-ink-700 hover:text-ink-950",
                  )}
                >
                  {entry}
                </Link>
              </li>
            ),
          )}

          <li>
            <PagerLink
              href={buildHref(Math.min(pageCount, page + 1), params, basePath)}
              disabled={page === pageCount}
              label="Next page"
            >
              <ChevronRight aria-hidden className="size-4" strokeWidth={1.75} />
            </PagerLink>
          </li>
        </ul>
      ) : null}
    </nav>
  );
}

function PagerLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const classes = "grid size-9 place-items-center border border-sand-300 text-ink-700 transition-colors";
  if (disabled) {
    return (
      <span aria-disabled="true" aria-label={`${label} (unavailable)`} className={cn(classes, "opacity-40")}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={cn(classes, "hover:border-ink-700 hover:text-ink-950")}>
      {children}
    </Link>
  );
}
