import NextImage from "next/image";
import { ImageOff } from "lucide-react";
import { canOptimize } from "@/lib/images";
import { cn } from "@/lib/cn";

/**
 * Renders product/site photography inside a positioned container.
 *
 * Uses the Next image optimiser for local files and allow-listed hosts, and
 * degrades to a plain <img> for anything else so an admin-supplied URL can
 * never break the page. `alt` is always required.
 */
export function Media({
  src,
  alt,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
  className,
  imageClassName,
  fit = "cover",
}: {
  src: string | null | undefined;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  fit?: "cover" | "contain";
}) {
  const objectFit = fit === "cover" ? "object-cover" : "object-contain";

  if (!src) {
    return (
      <div className={cn("grid h-full w-full place-items-center bg-sand-200 text-ink-500", className)}>
        <ImageOff aria-hidden className="size-6" strokeWidth={1.5} />
        <span className="sr-only">{alt || "Image unavailable"}</span>
      </div>
    );
  }

  if (!canOptimize(src)) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={cn("h-full w-full", objectFit, className, imageClassName)}
      />
    );
  }

  return (
    <NextImage
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn(objectFit, className, imageClassName)}
    />
  );
}
