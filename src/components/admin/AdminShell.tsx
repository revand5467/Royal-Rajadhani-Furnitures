import Link from "next/link";
import { ArrowUpRight, LogOut } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { logoutAction } from "@/server/actions/auth";
import type { AdminUser } from "@/lib/auth";

export function AdminShell({
  user,
  counts,
  children,
}: {
  user: AdminUser;
  counts: { drafts: number; inquiries: number };
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-sand-100 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:border-r lg:border-sand-200">
        <div className="hidden border-b border-sand-200 bg-sand-50 px-6 py-6 lg:block">
          <Link href="/admin" className="font-display text-lg text-ink-950">
            Rajadhani Furniture
          </Link>
          <p className="mt-1 text-xs tracking-[0.16em] text-ink-500 uppercase">Admin</p>
        </div>

        <AdminNav
          counts={counts}
          footer={
            <div className="space-y-4">
              <div>
                <p className="text-xs tracking-[0.14em] text-ink-500 uppercase">Signed in</p>
                <p className="mt-1 font-medium text-ink-900">{user.name}</p>
                <p className="truncate text-xs text-ink-500">{user.email}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  href="/"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs text-ink-700 hover:text-clay-700"
                >
                  View storefront
                  <ArrowUpRight aria-hidden className="size-3.5" />
                  <span className="sr-only">(opens in a new tab)</span>
                </Link>
                <form action={logoutAction}>
                  <button type="submit" className="inline-flex items-center gap-1.5 text-xs text-ink-700 hover:text-clay-700">
                    <LogOut aria-hidden className="size-3.5" strokeWidth={1.75} />
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          }
        />
      </aside>

      <main className="min-w-0 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">{children}</main>
    </div>
  );
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b border-sand-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="mt-2 font-display text-3xl text-ink-950 sm:text-4xl">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}
