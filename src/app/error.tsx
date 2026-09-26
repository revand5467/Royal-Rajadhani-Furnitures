"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app] unhandled error:", error.message);
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-start justify-center py-20">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-4 font-display text-4xl text-ink-950">We hit a problem loading this page</h1>
      <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-600">
        Nothing you did caused this. Try again, and if it keeps happening please let the workshop know.
      </p>
      {error.digest ? (
        <p className="mt-3 text-xs text-ink-500">
          Reference: <code>{error.digest}</code>
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          Try again
        </button>
        <Link href="/" className="btn btn-secondary">
          Back to the homepage
        </Link>
      </div>
    </div>
  );
}
