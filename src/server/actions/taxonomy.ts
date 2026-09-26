"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { uniqueSlug } from "@/lib/slug";
import { categorySchema, collectionSchema, fieldErrors, formDataToObject } from "@/lib/validation";
import type { TaxonomyState } from "@/lib/form-state";

function refresh() {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/furniture");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/collection");
}

export async function saveCategory(_previous: TaxonomyState, formData: FormData): Promise<TaxonomyState> {
  await requireAdmin("/admin/categories");

  const parsed = categorySchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { status: "error", message: "Check the fields below.", fieldErrors: fieldErrors(parsed.error) };
  }
  const input = parsed.data;
  const id = input.id || null;

  const slug = await uniqueSlug(
    input.slug || input.name,
    async (candidate) => {
      const clash = await prisma.category.findFirst({
        where: { slug: candidate, ...(id ? { id: { not: id } } : {}) },
        select: { id: true },
      });
      return Boolean(clash);
    },
    "category",
  );

  try {
    if (id) {
      await prisma.category.update({
        where: { id },
        data: { name: input.name, slug, blurb: input.blurb ?? null, position: input.position },
      });
    } else {
      await prisma.category.create({
        data: { name: input.name, slug, blurb: input.blurb ?? null, position: input.position },
      });
    }
  } catch (error) {
    console.error("[taxonomy] category save failed:", error instanceof Error ? error.message : error);
    return { status: "error", message: "The category could not be saved." };
  }

  refresh();
  return { status: "success", message: id ? "Category updated." : "Category created." };
}

export async function deleteCategory(_previous: TaxonomyState, formData: FormData): Promise<TaxonomyState> {
  await requireAdmin("/admin/categories");

  const id = String(formData.get("id") ?? "");
  if (!id) return { status: "error", message: "Missing category reference." };

  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    return {
      status: "error",
      message: `This category still holds ${productCount} listing${productCount === 1 ? "" : "s"}. Move them to another category first — nothing was deleted.`,
    };
  }

  try {
    await prisma.category.delete({ where: { id } });
  } catch (error) {
    console.error("[taxonomy] category delete failed:", error instanceof Error ? error.message : error);
    return { status: "error", message: "The category could not be deleted." };
  }

  refresh();
  return { status: "success", message: "Category deleted." };
}

export async function saveCollection(_previous: TaxonomyState, formData: FormData): Promise<TaxonomyState> {
  await requireAdmin("/admin/categories");

  const parsed = collectionSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { status: "error", message: "Check the fields below.", fieldErrors: fieldErrors(parsed.error) };
  }
  const input = parsed.data;
  const id = input.id || null;

  const slug = await uniqueSlug(
    input.slug || input.name,
    async (candidate) => {
      const clash = await prisma.collection.findFirst({
        where: { slug: candidate, ...(id ? { id: { not: id } } : {}) },
        select: { id: true },
      });
      return Boolean(clash);
    },
    "collection",
  );

  try {
    if (id) {
      await prisma.collection.update({
        where: { id },
        data: {
          name: input.name,
          slug,
          blurb: input.blurb ?? null,
          position: input.position,
          featured: input.featured,
        },
      });
    } else {
      await prisma.collection.create({
        data: {
          name: input.name,
          slug,
          blurb: input.blurb ?? null,
          position: input.position,
          featured: input.featured,
        },
      });
    }
  } catch (error) {
    console.error("[taxonomy] collection save failed:", error instanceof Error ? error.message : error);
    return { status: "error", message: "The collection could not be saved." };
  }

  refresh();
  return { status: "success", message: id ? "Collection updated." : "Collection created." };
}

export async function deleteCollection(_previous: TaxonomyState, formData: FormData): Promise<TaxonomyState> {
  await requireAdmin("/admin/categories");

  const id = String(formData.get("id") ?? "");
  if (!id) return { status: "error", message: "Missing collection reference." };

  try {
    // Listings keep existing; the relation is cleared by the schema's SetNull.
    await prisma.collection.delete({ where: { id } });
  } catch (error) {
    console.error("[taxonomy] collection delete failed:", error instanceof Error ? error.message : error);
    return { status: "error", message: "The collection could not be deleted." };
  }

  refresh();
  return { status: "success", message: "Collection deleted. Its listings are still available." };
}
