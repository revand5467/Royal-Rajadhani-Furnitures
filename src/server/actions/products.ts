"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { uniqueSlug } from "@/lib/slug";
import { deleteStoredImageByUrl, storeImage, UploadError } from "@/lib/storage";
import { effectivePriceCents } from "@/lib/pricing";
import {
  externalImageSchema,
  fieldErrors,
  formDataToObject,
  imageMetaSchema,
  productSchema,
} from "@/lib/validation";
import type { ProductFormState, UploadState } from "@/lib/form-state";

function refreshStorefront(slug?: string) {
  revalidatePath("/");
  revalidatePath("/collection");
  revalidatePath("/about");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/furniture");
  revalidatePath("/admin");
  if (slug) revalidatePath(`/furniture/${slug}`);
}

async function assertUniqueSku(sku: string, excludeId?: string) {
  const existing = await prisma.product.findFirst({
    where: { sku, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true },
  });
  return !existing;
}

export async function saveProduct(_previous: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireAdmin("/admin/furniture");

  const parsed = productSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }
  const input = parsed.data;
  const id = String(formData.get("id") ?? "").trim() || null;

  const [category, collection] = await Promise.all([
    prisma.category.findUnique({ where: { id: input.categoryId }, select: { id: true } }),
    input.collectionId
      ? prisma.collection.findUnique({ where: { id: input.collectionId }, select: { id: true } })
      : Promise.resolve(null),
  ]);

  if (!category) {
    return { status: "error", message: "Choose a category.", fieldErrors: { categoryId: "Select an existing category." } };
  }
  if (input.collectionId && !collection) {
    return {
      status: "error",
      message: "That collection no longer exists.",
      fieldErrors: { collectionId: "Select an existing collection, or leave it empty." },
    };
  }

  const sku = input.sku.trim();
  if (!(await assertUniqueSku(sku, id ?? undefined))) {
    return {
      status: "error",
      message: "That SKU is already used by another piece.",
      fieldErrors: { sku: "SKUs must be unique — try adding a finish or size suffix." },
    };
  }

  const slug = await uniqueSlug(
    input.slug || input.name,
    async (candidate) => {
      const clash = await prisma.product.findFirst({
        where: { slug: candidate, ...(id ? { id: { not: id } } : {}) },
        select: { id: true },
      });
      return Boolean(clash);
    },
    "piece",
  );

  const priceCents = Math.round(input.price * 100);

  // Discounts are optional. When one is set its value must be positive and must
  // not exceed the list price; the resulting selling price is denormalised onto
  // the row so the catalog can filter and sort on a single integer column.
  let discountType: string | null = null;
  let discountPercent: number | null = null;
  let discountValueCents: number | null = null;

  if (input.discountType) {
    const value = input.discountValue ?? 0;
    if (value <= 0) {
      return {
        status: "error",
        message: "Check the discount.",
        fieldErrors: { discountValue: "Enter a discount greater than zero, or remove it." },
      };
    }
    if (input.discountType === "PERCENT") {
      if (value > 100) {
        return {
          status: "error",
          message: "Check the discount.",
          fieldErrors: { discountValue: "A percentage discount cannot exceed 100%." },
        };
      }
      discountType = "PERCENT";
      discountPercent = value;
    } else {
      const valueCents = Math.round(value * 100);
      if (valueCents > priceCents) {
        return {
          status: "error",
          message: "Check the discount.",
          fieldErrors: { discountValue: "The discount cannot be larger than the original price." },
        };
      }
      discountType = "AMOUNT";
      discountValueCents = valueCents;
    }
  }

  const sellingPriceCents = effectivePriceCents({
    priceCents,
    discountType,
    discountPercent,
    discountValueCents,
  });

  const data = {
    name: input.name,
    slug,
    summary: input.summary,
    description: input.description,
    priceCents,
    discountType,
    discountPercent,
    discountValueCents,
    effectivePriceCents: sellingPriceCents,
    currency: input.currency,
    categoryId: category.id,
    collectionId: collection?.id ?? null,
    materials: input.materials,
    finish: input.finish ?? null,
    widthCm: input.widthCm ?? null,
    depthCm: input.depthCm ?? null,
    heightCm: input.heightCm ?? null,
    dimensionNote: input.dimensionNote ?? null,
    careInstructions: input.careInstructions ?? null,
    availability: input.availability,
    sku,
    featured: input.featured,
    status: input.status,
  };

  try {
    if (id) {
      const existing = await prisma.product.findUnique({ where: { id }, select: { publishedAt: true, slug: true } });
      if (!existing) return { status: "error", message: "That listing no longer exists." };

      await prisma.product.update({
        where: { id },
        data: {
          ...data,
          publishedAt:
            input.status === "PUBLISHED" ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
        },
      });
      refreshStorefront(slug);
      if (existing.slug !== slug) revalidatePath(`/furniture/${existing.slug}`);

      return { status: "success", message: "Changes saved.", savedAt: Date.now() };
    }

    const created = await prisma.product.create({
      data: {
        ...data,
        publishedAt: input.status === "PUBLISHED" ? new Date() : null,
      },
      select: { id: true },
    });
    refreshStorefront(slug);
    redirect(`/admin/furniture/${created.id}?created=1`);
  } catch (error) {
    console.error("[product] save failed:", error instanceof Error ? error.message : error);
    return { status: "error", message: "The listing could not be saved. Please try again." };
  }
}

export async function setProductStatus(formData: FormData): Promise<void> {
  await requireAdmin("/admin/furniture");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["DRAFT", "PUBLISHED"].includes(status)) return;

  const product = await prisma.product.findUnique({ where: { id }, select: { publishedAt: true, slug: true } });
  if (!product) return;

  await prisma.product.update({
    where: { id },
    data: {
      status,
      publishedAt: status === "PUBLISHED" ? (product.publishedAt ?? new Date()) : product.publishedAt,
    },
  });

  refreshStorefront(product.slug);
}

export async function toggleProductFeatured(formData: FormData): Promise<void> {
  await requireAdmin("/admin/furniture");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const product = await prisma.product.findUnique({ where: { id }, select: { featured: true, slug: true } });
  if (!product) return;

  await prisma.product.update({ where: { id }, data: { featured: !product.featured } });
  refreshStorefront(product.slug);
}

export async function deleteProduct(formData: FormData): Promise<void> {
  await requireAdmin("/admin/furniture");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const product = await prisma.product.findUnique({
    where: { id },
    select: { slug: true, images: { select: { url: true } } },
  });
  if (!product) return;

  await prisma.product.delete({ where: { id } });

  // Best-effort cleanup of uploaded files; foreign URLs are left untouched.
  await Promise.all(product.images.map((image) => deleteStoredImageByUrl(image.url)));

  refreshStorefront(product.slug);
  redirect("/admin/furniture?deleted=1");
}

/* --------------------------------------------------------------------------
   Images
-------------------------------------------------------------------------- */

export async function uploadProductImages(_previous: UploadState, formData: FormData): Promise<UploadState> {
  await requireAdmin("/admin/furniture");

  const productId = String(formData.get("productId") ?? "");
  if (!productId) return { status: "error", message: "Missing product reference." };

  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length === 0) return { status: "error", message: "Choose one or more image files to upload." };
  if (files.length > 12) return { status: "error", message: "Upload at most 12 images at a time." };

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, slug: true, _count: { select: { images: true } } },
  });
  if (!product) return { status: "error", message: "That listing no longer exists." };

  const altBase = String(formData.get("altBase") ?? "").trim();
  let nextPosition = product._count.images;
  const failures: string[] = [];
  let uploaded = 0;

  for (const file of files) {
    try {
      const stored = await storeImage(file, "products");
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: stored.url,
          alt: altBase || `${product.slug.replace(/-/g, " ")} — uploaded photograph`,
          width: stored.width,
          height: stored.height,
          position: nextPosition,
          isCover: product._count.images + uploaded === 0,
        },
      });
      nextPosition += 1;
      uploaded += 1;
    } catch (error) {
      const reason = error instanceof UploadError ? error.message : "Upload failed.";
      failures.push(`${file.name}: ${reason}`);
    }
  }

  refreshStorefront(product.slug);

  if (uploaded === 0) {
    return { status: "error", message: "No images were stored.", failures };
  }
  return {
    status: "success",
    message: uploaded === 1 ? "1 image uploaded." : `${uploaded} images uploaded.`,
    uploaded,
    failures,
  };
}

export async function addExternalImage(_previous: UploadState, formData: FormData): Promise<UploadState> {
  await requireAdmin("/admin/furniture");

  const parsed = externalImageSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { status: "error", message: Object.values(fieldErrors(parsed.error))[0] ?? "Check the image details." };
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true, slug: true, _count: { select: { images: true } } },
  });
  if (!product) return { status: "error", message: "That listing no longer exists." };

  await prisma.productImage.create({
    data: {
      productId: product.id,
      url: parsed.data.url,
      alt: parsed.data.alt,
      credit: parsed.data.credit ?? null,
      position: product._count.images,
      isCover: product._count.images === 0,
    },
  });

  refreshStorefront(product.slug);
  return { status: "success", message: "Image linked." };
}

export async function removeProductImage(formData: FormData): Promise<void> {
  await requireAdmin("/admin/furniture");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const image = await prisma.productImage.findUnique({
    where: { id },
    select: { url: true, isCover: true, productId: true, product: { select: { slug: true } } },
  });
  if (!image) return;

  await prisma.productImage.delete({ where: { id } });
  await deleteStoredImageByUrl(image.url);

  if (image.isCover) {
    const next = await prisma.productImage.findFirst({
      where: { productId: image.productId },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    if (next) await prisma.productImage.update({ where: { id: next.id }, data: { isCover: true } });
  }

  refreshStorefront(image.product.slug);
}

export async function setCoverImage(formData: FormData): Promise<void> {
  await requireAdmin("/admin/furniture");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const image = await prisma.productImage.findUnique({
    where: { id },
    select: { productId: true, product: { select: { slug: true } } },
  });
  if (!image) return;

  await prisma.$transaction([
    prisma.productImage.updateMany({ where: { productId: image.productId }, data: { isCover: false } }),
    prisma.productImage.update({ where: { id }, data: { isCover: true } }),
  ]);

  refreshStorefront(image.product.slug);
}

export async function saveImageAlt(formData: FormData): Promise<void> {
  await requireAdmin("/admin/furniture");

  const parsed = imageMetaSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const image = await prisma.productImage.findUnique({
    where: { id },
    select: { product: { select: { slug: true } } },
  });
  if (!image) return;

  await prisma.productImage.update({ where: { id }, data: { alt: parsed.data.alt ?? "" } });
  refreshStorefront(image.product.slug);
}

/** Applies an explicit image order (comma-separated ids) from the admin UI. */
export async function reorderProductImages(formData: FormData): Promise<void> {
  await requireAdmin("/admin/furniture");

  const productId = String(formData.get("productId") ?? "");
  const order = String(formData.get("order") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (!productId || order.length === 0) return;

  const images = await prisma.productImage.findMany({
    where: { productId },
    select: { id: true, product: { select: { slug: true } } },
  });
  const owned = new Set(images.map((image) => image.id));
  const ordered = order.filter((id) => owned.has(id));
  // Anything not mentioned keeps its relative order at the end.
  const remaining = images.map((image) => image.id).filter((id) => !ordered.includes(id));
  const finalOrder = [...ordered, ...remaining];

  await prisma.$transaction(
    finalOrder.map((id, index) => prisma.productImage.update({ where: { id }, data: { position: index } })),
  );

  const slug = images[0]?.product.slug;
  refreshStorefront(slug);
}
