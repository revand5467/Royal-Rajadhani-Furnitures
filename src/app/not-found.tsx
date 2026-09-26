import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-start justify-center py-20">
      <p className="eyebrow">Error 404</p>
      <h1 className="mt-4 font-display text-4xl text-ink-950 sm:text-5xl">We could not find that page</h1>
      <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-600">
        The page may have moved, or the piece may no longer be in the collection. The catalogue is always up to date.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/collection" className="btn btn-primary">
          Explore the collection
        </Link>
        <Link href="/contact" className="btn btn-secondary">
          Contact the workshop
        </Link>
      </div>
    </div>
  );
}
