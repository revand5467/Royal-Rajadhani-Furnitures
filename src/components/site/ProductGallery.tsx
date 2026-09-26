"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import Image from "next/image";
import { canOptimize } from "@/lib/images";
import { cn } from "@/lib/cn";

type GalleryImage = { id: string; url: string; alt: string };

export function ProductGallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  const count = images.length;
  const active = images[activeIndex];

  const go = useCallback(
    (delta: number) => {
      setActiveIndex((index) => (index + delta + count) % count);
    },
    [count],
  );

  // Keyboard support + focus handling for the enlarged view.
  useEffect(() => {
    if (!zoomOpen) return;
    lastFocused.current = document.activeElement as HTMLElement | null;
    const node = dialogRef.current;
    node?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setZoomOpen(false);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        go(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(-1);
      } else if (event.key === "Tab") {
        // Keep focus inside the dialog while it is open.
        const focusables = node?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables || focusables.length === 0) return;
        const list = Array.from(focusables);
        const first = list[0]!;
        const last = list[list.length - 1]!;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      lastFocused.current?.focus();
    };
  }, [zoomOpen, go]);

  if (!active) {
    return <div className="aspect-4/3 w-full bg-sand-200" aria-hidden />;
  }

  const renderImage = (image: GalleryImage, sizes: string, priority = false) =>
    canOptimize(image.url) ? (
      <Image
        src={image.url}
        alt={image.alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover"
        onClick={() => setZoomOpen(true)}
      />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image.url}
        alt={image.alt}
        className="absolute inset-0 h-full w-full object-cover"
        onClick={() => setZoomOpen(true)}
      />
    );

  return (
    <div>
      <div className="relative aspect-4/3 w-full overflow-hidden bg-sand-200">
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          className="absolute inset-0 z-10 cursor-zoom-in"
          aria-label={`Enlarge image ${activeIndex + 1} of ${count}`}
        />
        {renderImage(active, "(min-width: 1024px) 55vw, 100vw", true)}

        <span className="pointer-events-none absolute right-3 bottom-3 flex items-center gap-1.5 bg-ink-950/80 px-2.5 py-1.5 text-[0.6875rem] tracking-[0.1em] text-sand-50 uppercase">
          <Expand aria-hidden className="size-3.5" strokeWidth={1.75} />
          Enlarge
        </span>

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute top-1/2 left-3 z-20 grid size-10 -translate-y-1/2 place-items-center bg-sand-50/90 text-ink-900 hover:bg-sand-50"
            >
              <ChevronLeft aria-hidden className="size-5" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute top-1/2 right-3 z-20 grid size-10 -translate-y-1/2 place-items-center bg-sand-50/90 text-ink-900 hover:bg-sand-50"
            >
              <ChevronRight aria-hidden className="size-5" strokeWidth={1.5} />
            </button>
          </>
        ) : null}
      </div>

      {count > 1 ? (
        <ul className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show image ${index + 1}: ${image.alt}`}
                aria-current={index === activeIndex}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden bg-sand-200 transition-opacity",
                  index === activeIndex ? "ring-2 ring-ink-950 ring-offset-2 ring-offset-sand-50" : "opacity-75 hover:opacity-100",
                )}
              >
                {canOptimize(image.url) ? (
                  <Image src={image.url} alt="" fill sizes="120px" className="object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image.url} alt="" className="h-full w-full object-cover" />
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <p aria-live="polite" className="sr-only">
        Image {activeIndex + 1} of {count}
      </p>

      {zoomOpen ? (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} — enlarged image ${activeIndex + 1} of ${count}`}
          tabIndex={-1}
          className="fixed inset-0 z-50 flex flex-col bg-ink-950/95 p-4 outline-none sm:p-8"
        >
          <div className="flex items-center justify-between gap-4 text-sand-100">
            <p className="text-xs tracking-[0.12em] uppercase">
              {activeIndex + 1} / {count}
            </p>
            <button
              type="button"
              onClick={() => setZoomOpen(false)}
              className="inline-flex items-center gap-2 border border-sand-100/40 px-3 py-1.5 text-xs tracking-[0.08em] uppercase hover:bg-sand-100/10"
            >
              <X aria-hidden className="size-4" strokeWidth={1.75} />
              Close
            </button>
          </div>

          <div className="relative mt-4 flex-1">
            {canOptimize(active.url) ? (
              <Image
                src={active.url}
                alt={active.alt}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={active.url} alt={active.alt} className="h-full w-full object-contain" />
            )}

            {count > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous image"
                  className="absolute top-1/2 left-0 grid size-11 -translate-y-1/2 place-items-center bg-sand-50/90 text-ink-900 hover:bg-sand-50"
                >
                  <ChevronLeft aria-hidden className="size-5" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next image"
                  className="absolute top-1/2 right-0 grid size-11 -translate-y-1/2 place-items-center bg-sand-50/90 text-ink-900 hover:bg-sand-50"
                >
                  <ChevronRight aria-hidden className="size-5" strokeWidth={1.5} />
                </button>
              </>
            ) : null}
          </div>

          <p className="mt-4 text-center text-sm text-sand-200">{active.alt}</p>
        </div>
      ) : null}
    </div>
  );
}
