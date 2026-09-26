import { ProductGridSkeleton } from "@/components/ui/Spinner";

export default function CollectionLoading() {
  return (
    <div className="container-page py-12 lg:py-16" aria-busy="true">
      <div className="max-w-3xl">
        <div className="h-3 w-24 bg-sand-200" />
        <div className="mt-5 h-11 w-2/3 bg-sand-200" />
        <div className="mt-5 h-4 w-full max-w-xl bg-sand-200" />
      </div>

      <div className="mt-10 border-y border-sand-200 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
          <div className="h-11 w-full max-w-sm bg-sand-200" />
          <div className="h-11 w-full max-w-xs bg-sand-200" />
        </div>
      </div>

      <div className="mt-12">
        <span className="sr-only">Loading the collection…</span>
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
