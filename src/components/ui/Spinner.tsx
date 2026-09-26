import { cn } from "@/lib/cn";

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className={cn("size-4 animate-spin", className)}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="M12 3a9 9 0 1 0 9 9" />
      </svg>
      <span className="sr-only">{label}</span>
    </>
  );
}

/** Skeleton used by the catalog's Suspense fallback. */
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <li key={index} className="animate-pulse">
          <div className="aspect-4/5 w-full bg-sand-200" />
          <div className="mt-4 h-4 w-2/3 bg-sand-200" />
          <div className="mt-2 h-3 w-1/3 bg-sand-200" />
        </li>
      ))}
    </ul>
  );
}
