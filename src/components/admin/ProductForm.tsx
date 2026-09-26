"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { CheckboxField, SelectField, TextArea, TextField } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { saveProduct } from "@/server/actions/products";
import { EMPTY_PRODUCT_STATE } from "@/lib/form-state";
import { AVAILABILITY, AVAILABILITY_LABELS, CURRENCIES, PRODUCT_STATUS, type Availability } from "@/lib/constants";
import { formatPriceInput } from "@/lib/format";
import { DISCOUNT_TYPES, DISCOUNT_TYPE_LABELS } from "@/lib/pricing";
import { canOptimize } from "@/lib/images";
import Image from "next/image";

type ProductValues = {
  id?: string;
  name: string;
  slug: string;
  summary: string;
  description: string;
  priceCents: number;
  discountType: string | null;
  discountPercent: number | null;
  discountValueCents: number | null;
  currency: string;
  categoryId: string;
  collectionId: string | null;
  materials: string;
  finish: string | null;
  widthCm: number | null;
  depthCm: number | null;
  heightCm: number | null;
  dimensionNote: string | null;
  careInstructions: string | null;
  availability: string;
  sku: string;
  featured: boolean;
  status: string;
};

const EMPTY: ProductValues = {
  name: "",
  slug: "",
  summary: "",
  description: "",
  priceCents: 0,
  discountType: null,
  discountPercent: null,
  discountValueCents: null,
  currency: "INR",
  categoryId: "",
  collectionId: null,
  materials: "",
  finish: null,
  widthCm: null,
  depthCm: null,
  heightCm: null,
  dimensionNote: null,
  careInstructions: null,
  availability: "IN_STOCK",
  sku: "",
  featured: false,
  status: "DRAFT",
};

export function ProductForm({
  product,
  categories,
  collections,
  coverImage,
}: {
  product?: ProductValues;
  categories: Array<{ id: string; name: string }>;
  collections: Array<{ id: string; name: string }>;
  coverImage?: { url: string; alt: string } | null;
}) {
  const values = product ?? EMPTY;
  const [state, formAction, isPending] = useActionState(saveProduct, EMPTY_PRODUCT_STATE);
  const errors = state.fieldErrors ?? {};
  const formRef = useRef<HTMLFormElement>(null);

  // A discount stores either a percentage or a fixed amount; the form posts it
  // as a single `discountValue` alongside the chosen type.
  const defaultDiscountValue =
    values.discountType === "PERCENT"
      ? (values.discountPercent ?? "")
      : values.discountValueCents
        ? formatPriceInput(values.discountValueCents)
        : "";

  // Move focus to the first error so keyboard and screen-reader users land on it.
  useEffect(() => {
    if (state.status !== "error") return;
    const firstKey = Object.keys(state.fieldErrors ?? {})[0];
    if (!firstKey) return;
    const field = formRef.current?.querySelector<HTMLElement>(`[name="${firstKey}"]`);
    field?.focus();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-10" noValidate>
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      {state.status === "error" && state.message ? <Alert tone="error">{state.message}</Alert> : null}
      {state.status === "success" ? (
        <Alert tone="success" title="Saved">
          {state.message} Changes are live on the storefront if this piece is published.
        </Alert>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div className="space-y-10">
          {/* Content --------------------------------------------------------- */}
          <section className="border border-sand-200 bg-white p-6" aria-labelledby="content-heading">
            <h2 id="content-heading" className="font-display text-xl text-ink-950">
              Description
            </h2>
            <div className="mt-6 space-y-5">
              <TextField
                label="Name"
                name="name"
                required
                defaultValue={values.name}
                error={errors.name}
                placeholder="Halden three-seat sofa"
                hint="Shown as the heading on the piece's page."
              />
              <TextField
                label="URL slug"
                name="slug"
                defaultValue={values.slug}
                error={errors.slug}
                placeholder="halden-three-seat-sofa"
                hint="Leave blank to generate one from the name. Must be unique."
              />
              <TextArea
                label="Short summary"
                name="summary"
                required
                rows={2}
                defaultValue={values.summary}
                error={errors.summary}
                hint="One or two lines shown on cards and in search results."
              />
              <TextArea
                label="Full description"
                name="description"
                required
                rows={8}
                defaultValue={values.description}
                error={errors.description}
                hint="Leave a blank line between paragraphs."
              />
            </div>
          </section>

          {/* Specification --------------------------------------------------- */}
          <section className="border border-sand-200 bg-white p-6" aria-labelledby="spec-heading">
            <h2 id="spec-heading" className="font-display text-xl text-ink-950">
              Materials &amp; dimensions
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <TextField
                label="Materials"
                name="materials"
                required
                defaultValue={values.materials}
                error={errors.materials}
                placeholder="Solid oak, wool, brass"
                className="sm:col-span-2"
              />
              <TextField
                label="Colour / finish"
                name="finish"
                defaultValue={values.finish ?? ""}
                error={errors.finish}
                placeholder="Soaped oak, oatmeal wool"
                className="sm:col-span-2"
              />
              <TextField
                label="Width (cm)"
                name="widthCm"
                type="number"
                min="1"
                max="2000"
                inputMode="numeric"
                defaultValue={values.widthCm ?? ""}
                error={errors.widthCm}
              />
              <TextField
                label="Depth (cm)"
                name="depthCm"
                type="number"
                min="1"
                max="2000"
                inputMode="numeric"
                defaultValue={values.depthCm ?? ""}
                error={errors.depthCm}
              />
              <TextField
                label="Height (cm)"
                name="heightCm"
                type="number"
                min="1"
                max="2000"
                inputMode="numeric"
                defaultValue={values.heightCm ?? ""}
                error={errors.heightCm}
              />
              <TextField
                label="Dimension note"
                name="dimensionNote"
                defaultValue={values.dimensionNote ?? ""}
                error={errors.dimensionNote}
                placeholder="Seat height 42 cm"
              />
              <TextArea
                label="Care instructions"
                name="careInstructions"
                rows={4}
                defaultValue={values.careInstructions ?? ""}
                error={errors.careInstructions}
                hint="Shown on the product page under “Care & keeping”."
                className="sm:col-span-2"
              />
            </div>
          </section>
        </div>

        {/* Sidebar ---------------------------------------------------------- */}
        <div className="space-y-6 lg:sticky lg:top-6">
          {coverImage ? (
            <div className="border border-sand-200 bg-white p-4">
              <p className="eyebrow">Cover image</p>
              <div className="relative mt-3 aspect-4/3 w-full overflow-hidden bg-sand-200">
                {canOptimize(coverImage.url) ? (
                  <Image src={coverImage.url} alt={coverImage.alt} fill sizes="288px" className="object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverImage.url} alt={coverImage.alt} className="h-full w-full object-cover" />
                )}
              </div>
            </div>
          ) : null}

          <section className="border border-sand-200 bg-white p-6" aria-labelledby="publish-heading">
            <h2 id="publish-heading" className="font-display text-lg text-ink-950">
              Publishing
            </h2>
            <div className="mt-5 space-y-5">
              <SelectField
                label="Status"
                name="status"
                defaultValue={values.status}
                error={errors.status}
                options={PRODUCT_STATUS.map((value) => ({
                  value,
                  label: value === "PUBLISHED" ? "Published (visible to customers)" : "Draft (hidden)",
                }))}
              />
              <CheckboxField
                label="Feature on the homepage"
                name="featured"
                defaultChecked={values.featured}
                description="Featured pieces appear in the homepage grid first."
              />
            </div>
          </section>

          <section className="border border-sand-200 bg-white p-6" aria-labelledby="price-heading">
            <h2 id="price-heading" className="font-display text-lg text-ink-950">
              Price &amp; reference
            </h2>
            <div className="mt-5 space-y-5">
              <TextField
                label="Price"
                name="price"
                required
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                defaultValue={values.priceCents ? formatPriceInput(values.priceCents) : ""}
                error={errors.price}
                hint="In whole units of the currency below. No online checkout is offered."
              />
              <SelectField
                label="Currency"
                name="currency"
                defaultValue={values.currency}
                error={errors.currency}
                options={CURRENCIES.map((code) => ({ value: code, label: code }))}
              />
              <SelectField
                label="Discount"
                name="discountType"
                defaultValue={values.discountType ?? ""}
                error={errors.discountType}
                hint="Optional. Choose a type, then enter the value below."
                options={[
                  { value: "", label: "No discount" },
                  ...DISCOUNT_TYPES.map((type) => ({ value: type, label: DISCOUNT_TYPE_LABELS[type] })),
                ]}
              />
              <TextField
                label="Discount value"
                name="discountValue"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                defaultValue={defaultDiscountValue}
                error={errors.discountValue}
                hint="A percentage (0–100) or a fixed amount, depending on the type above. Leave blank for none."
              />
              <TextField
                label="SKU / reference"
                name="sku"
                required
                defaultValue={values.sku}
                error={errors.sku}
                placeholder="AN-SOF-014"
              />
            </div>
          </section>

          <section className="border border-sand-200 bg-white p-6" aria-labelledby="org-heading">
            <h2 id="org-heading" className="font-display text-lg text-ink-950">
              Organisation
            </h2>
            <div className="mt-5 space-y-5">
              <SelectField
                label="Category"
                name="categoryId"
                required
                defaultValue={values.categoryId}
                error={errors.categoryId}
                options={[
                  { value: "", label: "Choose a category…" },
                  ...categories.map((category) => ({ value: category.id, label: category.name })),
                ]}
              />
              <SelectField
                label="Collection (optional)"
                name="collectionId"
                defaultValue={values.collectionId ?? ""}
                error={errors.collectionId}
                options={[
                  { value: "", label: "No collection" },
                  ...collections.map((collection) => ({ value: collection.id, label: collection.name })),
                ]}
              />
              <SelectField
                label="Availability"
                name="availability"
                defaultValue={values.availability}
                error={errors.availability}
                options={AVAILABILITY.map((value) => ({ value, label: AVAILABILITY_LABELS[value as Availability] }))}
              />
            </div>
          </section>

          <div className="border border-sand-200 bg-white p-6">
            <button type="submit" className="btn btn-primary w-full" disabled={isPending} aria-busy={isPending}>
              {isPending ? (
                <>
                  <Spinner label="Saving the listing" />
                  Saving…
                </>
              ) : values.id ? (
                "Save changes"
              ) : (
                "Create listing"
              )}
            </button>
            {state.status === "success" ? (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-success-600">
                <CheckCircle2 aria-hidden className="size-3.5" />
                Saved just now
              </p>
            ) : null}
            {values.id ? (
              <p className="mt-3 text-xs text-ink-500">
                <Link href={`/admin/furniture/${values.id}/preview`} className="underline underline-offset-4">
                  Preview the customer view
                </Link>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </form>
  );
}
