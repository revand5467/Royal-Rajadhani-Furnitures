"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FolderTree, Home, LayoutGrid, Mail, Menu, Settings, Sofa, X } from "lucide-react";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/admin", label: "Dashboard", Icon: Home, exact: true },
  { href: "/admin/furniture", label: "Listings", Icon: Sofa, badgeKey: "drafts" as const },
  { href: "/admin/categories", label: "Categories", Icon: LayoutGrid },
  { href: "/admin/inquiries", label: "Inquiries", Icon: Mail, badgeKey: "inquiries" as const },
  { href: "/admin/homepage", label: "Homepage", Icon: FolderTree },
  { href: "/admin/settings", label: "Store details", Icon: Settings },
];

export function AdminNav({
  counts,
  footer,
}: {
  counts: { drafts: number; inquiries: number };
  footer?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (item: (typeof ITEMS)[number]) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const badge = (item: (typeof ITEMS)[number]) => {
    if (!item.badgeKey) return null;
    const value = counts[item.badgeKey];
    if (!value) return null;
    return (
      <span className="ml-auto min-w-5 bg-clay-100 px-1.5 py-0.5 text-center text-[0.6875rem] font-medium text-clay-700 tabular-nums">
        {value}
      </span>
    );
  };

  return (
    <>
      {/* Mobile bar */}
      <div className="flex items-center justify-between border-b border-sand-200 bg-sand-50 px-5 py-3 lg:hidden">
        <Link href="/admin" className="font-display text-base text-ink-950">
          Rajadhani Furniture <span className="text-ink-500">admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="admin-nav"
          className="inline-flex items-center gap-2 border border-sand-300 px-3 py-1.5 text-xs tracking-[0.08em] uppercase"
        >
          {open ? <X aria-hidden className="size-4" /> : <Menu aria-hidden className="size-4" />}
          Menu
        </button>
      </div>

      <nav
        id="admin-nav"
        aria-label="Admin"
        className={cn("border-b border-sand-200 bg-sand-50 lg:block lg:border-b-0", !open && "hidden")}
      >
        <ul className="px-3 py-3 lg:px-3 lg:py-6">
          {ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                    active ? "bg-ink-950 text-sand-50" : "text-ink-700 hover:bg-sand-100 hover:text-ink-950",
                  )}
                >
                  <item.Icon aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
                  {item.label}
                  {badge(item)}
                </Link>
              </li>
            );
          })}
        </ul>

        {footer ? <div className="border-t border-sand-200 px-5 py-5 text-sm">{footer}</div> : null}
      </nav>
    </>
  );
}
