export default function ProductLoading() {
  return (
    <div className="container-page py-10 lg:py-14" aria-busy="true">
      <div className="h-3 w-64 bg-sand-200" />
      <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <div className="aspect-4/3 w-full bg-sand-200" />
          <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="aspect-square bg-sand-200" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="h-6 w-40 bg-sand-200" />
          <div className="mt-4 h-10 w-3/4 bg-sand-200" />
          <div className="mt-4 h-7 w-28 bg-sand-200" />
          <div className="mt-6 space-y-2">
            <div className="h-4 w-full bg-sand-200" />
            <div className="h-4 w-5/6 bg-sand-200" />
          </div>
          <span className="sr-only">Loading this piece…</span>
        </div>
      </div>
    </div>
  );
}
