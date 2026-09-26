"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/collection", label: "Collection" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Visit & contact" },
];

export function SiteHeader({ storeName }: { storeName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-sand-200 bg-sand-50/95 backdrop-blur-sm">
      <div className="container-page flex h-16 items-center justify-between gap-6 md:h-20">
        <Link href="/" className="font-display text-lg tracking-tight text-ink-950 md:text-xl">
          {storeName}
          <span className="sr-only"> — home</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-9 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "relative text-[0.8125rem] tracking-[0.08em] uppercase transition-colors",
                isActive(item.href) ? "text-ink-950" : "text-ink-600 hover:text-ink-950",
              )}
            >
              {item.label}
              {isActive(item.href) ? (
                <span aria-hidden className="absolute -bottom-1.5 left-0 h-px w-full bg-clay-600" />
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link href="/collection" className="btn btn-secondary">
            Explore collection
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="-mr-2 inline-flex items-center gap-2 p-2 text-ink-800 md:hidden"
        >
          {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
          <span className="text-xs tracking-[0.08em] uppercase">{open ? "Close" : "Menu"}</span>
        </button>
      </div>

      <div
        id="mobile-nav"
        hidden={!open}
        className="border-t border-sand-200 bg-sand-50 md:hidden"
      >
        <nav aria-label="Mobile" className="container-page flex flex-col py-2">
          <Link href="/" className="border-b border-sand-200 py-3.5 text-sm text-ink-800">
            Home
          </Link>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="border-b border-sand-200 py-3.5 text-sm text-ink-800">
              {item.label}
            </Link>
          ))}
          <Link href="/collection" className="btn btn-primary my-4">
            Explore collection
          </Link>
        </nav>
      </div>
    </header>
  );
}
