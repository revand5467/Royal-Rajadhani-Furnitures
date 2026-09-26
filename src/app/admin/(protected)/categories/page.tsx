import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { CategoriesManager, CollectionsManager } from "@/components/admin/TaxonomyManager";
import { Alert } from "@/components/ui/Alert";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Categories & collections" };

export default async function AdminCategoriesPage() {
  const [categories, collections] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ position: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: true } } },
    }),
    prisma.collection.findMany({
      orderBy: [{ position: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: true } } },
    }),
  ]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Catalog"
        title="Categories & collections"
        description="Categories organise everything; collections group pieces across categories for the homepage and curated browsing."
      />

      <Alert tone="info" className="mb-10" title="Deleting safely">
        <p>
          A category can only be deleted when nothing is filed under it — the app checks and refuses rather than
          orphaning listings. Deleting a collection never deletes its pieces; they simply stop being grouped.
        </p>
      </Alert>

      <div className="space-y-14">
        <CategoriesManager
          categories={categories.map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            blurb: category.blurb,
            position: category.position,
            productCount: category._count.products,
          }))}
        />

        <div className="rule" />

        <CollectionsManager
          collections={collections.map((collection) => ({
            id: collection.id,
            name: collection.name,
            slug: collection.slug,
            blurb: collection.blurb,
            position: collection.position,
            productCount: collection._count.products,
            featured: collection.featured,
          }))}
        />
      </div>
    </>
  );
}
