import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { Alert } from "@/components/ui/Alert";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "New listing" };

export default async function NewProductPage() {
  const [categories, collections] = await Promise.all([
    prisma.category.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
    prisma.collection.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Listings"
        title="New listing"
        description="Fill in the details below. Save as a draft while you gather photography — nothing is visible to customers until it is published."
        actions={
          <Link href="/admin/furniture" className="btn btn-secondary">
            Back to listings
          </Link>
        }
      />

      {categories.length === 0 ? (
        <Alert tone="warning" className="mb-8" title="Create a category first">
          <p>
            Every listing needs a category.{" "}
            <Link href="/admin/categories" className="underline underline-offset-4">
              Add one now
            </Link>
            , then come back here.
          </p>
        </Alert>
      ) : (
        <ProductForm categories={categories} collections={collections} />
      )}
    </>
  );
}
