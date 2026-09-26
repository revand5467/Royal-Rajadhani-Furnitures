"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, ImagePlus, Link2, Save, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import {
  addExternalImage,
  removeProductImage,
  reorderProductImages,
  saveImageAlt,
  setCoverImage,
  uploadProductImages,
} from "@/server/actions/products";
import { EMPTY_UPLOAD_STATE } from "@/lib/form-state";
import { IMAGE_ACCEPT, MAX_UPLOAD_MB_HINT } from "@/lib/admin-copy";
import { canOptimize } from "@/lib/images";
import { cn } from "@/lib/cn";

export type ManagedImage = {
  id: string;
  url: string;
  alt: string;
  credit: string | null;
  width: number | null;
  height: number | null;
  isCover: boolean;
};

export function ImageManager({ productId, images }: { productId: string; images: ManagedImage[] }) {
  const [order, setOrder] = useState(() => images.map((image) => image.id));
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const reorderForm = useRef<HTMLFormElement>(null);

  const byId = useMemo(() => new Map(images.map((image) => [image.id, image])), [images]);
  const ordered = useMemo(
    () => order.map((id) => byId.get(id)).filter((image): image is ManagedImage => Boolean(image)),
    [order, byId],
  );

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length || from === to) return;
    const next = [...order];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    setOrder(next);
    // Persist on the next frame so the hidden input has the new value.
    requestAnimationFrame(() => reorderForm.current?.requestSubmit());
  };

  return (
    <section className="border border-sand-200 bg-white p-6" aria-labelledby="images-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="images-heading" className="font-display text-xl text-ink-950">
          Photography
        </h2>
        <p className="text-xs text-ink-500">
          {images.length === 0
            ? "No images yet — add at least one before publishing."
            : `${images.length} image${images.length === 1 ? "" : "s"} · the cover is shown on cards`}
        </p>
      </div>

      <UploadForm productId={productId} />
      <ExternalImageForm productId={productId} />

      {/* Reorder state is submitted by this standalone form (no nested forms). */}
      <form ref={reorderForm} action={reorderProductImages} className="hidden">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="order" value={order.join(",")} />
      </form>

      {ordered.length ? (
        <ul className="mt-8 space-y-3">
          {ordered.map((image, index) => (
            <li
              key={image.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (dragIndex !== null) move(dragIndex, index);
                setDragIndex(null);
              }}
              className={cn(
                "grid gap-4 border border-sand-200 p-3 sm:grid-cols-[7rem_minmax(0,1fr)]",
                dragIndex === index && "opacity-60",
              )}
            >
              <div className="relative aspect-4/3 w-full overflow-hidden bg-sand-200">
                {canOptimize(image.url) ? (
                  <Image src={image.url} alt="" fill sizes="120px" className="object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image.url} alt="" className="h-full w-full object-cover" />
                )}
                {image.isCover ? (
                  <span className="absolute inset-x-0 bottom-0 bg-ink-950/85 py-1 text-center text-[0.625rem] tracking-[0.12em] text-sand-50 uppercase">
                    Cover
                  </span>
                ) : null}
              </div>

              <div className="min-w-0">
                <form action={saveImageAlt} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={image.id} />
                  <input type="hidden" name="productId" value={productId} />
                  <div className="min-w-0 flex-1">
                    <label htmlFor={`alt-${image.id}`} className="field-label">
                      Alt text (image {index + 1})
                    </label>
                    <input
                      id={`alt-${image.id}`}
                      name="alt"
                      defaultValue={image.alt}
                      className="field-input"
                      placeholder="Describe what the photograph shows"
                    />
                  </div>
                  <button type="submit" className="btn btn-quiet">
                    <Save aria-hidden className="size-3.5" strokeWidth={1.75} />
                    Save
                  </button>
                </form>

                {image.credit ? <p className="mt-1.5 text-xs text-ink-500">Credit: {image.credit}</p> : null}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => move(index, index - 1)}
                    disabled={index === 0}
                    className="btn btn-quiet disabled:opacity-40"
                    aria-label={`Move image ${index + 1} earlier`}
                  >
                    <ArrowUp aria-hidden className="size-3.5" strokeWidth={1.75} />
                    Earlier
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, index + 1)}
                    disabled={index === ordered.length - 1}
                    className="btn btn-quiet disabled:opacity-40"
                    aria-label={`Move image ${index + 1} later`}
                  >
                    <ArrowDown aria-hidden className="size-3.5" strokeWidth={1.75} />
                    Later
                  </button>

                  {image.isCover ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs text-ink-500">
                      <Star aria-hidden className="size-3.5 fill-clay-600 text-clay-600" />
                      Cover image
                    </span>
                  ) : (
                    <form action={setCoverImage}>
                      <input type="hidden" name="id" value={image.id} />
                      <button type="submit" className="btn btn-quiet">
                        <Star aria-hidden className="size-3.5" strokeWidth={1.75} />
                        Make cover
                      </button>
                    </form>
                  )}

                  <form action={removeProductImage} className="ml-auto">
                    <input type="hidden" name="id" value={image.id} />
                    <ConfirmSubmit question="Remove this image?" confirmLabel="Remove">
                      <Trash2 aria-hidden className="size-3.5" strokeWidth={1.75} />
                      Remove
                    </ConfirmSubmit>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-6 flex items-center gap-2 text-xs text-ink-500">
        <GripVertical aria-hidden className="size-3.5" strokeWidth={1.75} />
        Drag a row to reorder, or use the arrow buttons. The first image is used as the cover on cards and in search
        results.
      </p>
    </section>
  );
}

function UploadForm({ productId }: { productId: string }) {
  const [state, formAction, isPending] = useActionState(uploadProductImages, EMPTY_UPLOAD_STATE);

  return (
    <form action={formAction} className="mt-6 border border-dashed border-sand-300 bg-sand-100 p-5">
      <input type="hidden" name="productId" value={productId} />

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-end">
        <div>
          <label htmlFor="files" className="field-label">
            Upload images
          </label>
          <input
            id="files"
            name="files"
            type="file"
            accept={IMAGE_ACCEPT}
            multiple
            required
            aria-describedby="files-hint"
            className="field-input file:mr-3 file:border-0 file:bg-ink-950 file:px-3 file:py-1.5 file:text-xs file:tracking-wide file:text-sand-50 file:uppercase"
          />
          <p id="files-hint" className="field-hint">
            JPEG, PNG, WebP, AVIF or GIF · up to {MAX_UPLOAD_MB_HINT} MB each · resized to a maximum of 2400px.
          </p>
        </div>

        <div>
          <label htmlFor="altBase" className="field-label">
            Alt text for this batch (optional)
          </label>
          <input
            id="altBase"
            name="altBase"
            className="field-input"
            placeholder="e.g. Halden sofa from the side"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={isPending} aria-busy={isPending}>
          {isPending ? (
            <>
              <Spinner label="Uploading images" />
              Uploading…
            </>
          ) : (
            <>
              <ImagePlus aria-hidden className="size-4" strokeWidth={1.75} />
              Upload
            </>
          )}
        </button>
        <p className="text-xs text-ink-500">Files are converted to WebP and stored locally.</p>
      </div>

      <div className="mt-4 space-y-3">
        {state.status === "success" && state.message ? <Alert tone="success">{state.message}</Alert> : null}
        {state.status === "error" && state.message ? <Alert tone="error">{state.message}</Alert> : null}
        {state.failures?.length ? (
          <Alert tone="warning" title="Some files were skipped">
            <ul className="list-disc space-y-1 pl-4">
              {state.failures.map((failure) => (
                <li key={failure}>{failure}</li>
              ))}
            </ul>
          </Alert>
        ) : null}
      </div>
    </form>
  );
}

function ExternalImageForm({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(addExternalImage, EMPTY_UPLOAD_STATE);

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 text-sm text-ink-700 underline underline-offset-4 hover:text-clay-700"
      >
        <Link2 aria-hidden className="size-4" strokeWidth={1.75} />
        Or link to an image hosted elsewhere
      </button>

      {open ? (
        <form action={formAction} className="mt-4 border border-sand-200 bg-sand-100 p-5">
          <input type="hidden" name="productId" value={productId} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="external-url" className="field-label">
                Image URL (https)
              </label>
              <input
                id="external-url"
                name="url"
                type="url"
                required
                className="field-input"
                placeholder="https://images.example.com/sofa.jpg"
              />
              <p className="field-hint">
                Allowed hosts are listed in <code>IMAGE_REMOTE_HOSTS</code>. Other hosts still work but are not
                optimised.
              </p>
            </div>
            <div>
              <label htmlFor="external-alt" className="field-label">
                Alt text
              </label>
              <input
                id="external-alt"
                name="alt"
                required
                minLength={3}
                className="field-input"
                placeholder="Halden sofa in the showroom"
              />
            </div>
            <div>
              <label htmlFor="external-credit" className="field-label">
                Credit (optional)
              </label>
              <input id="external-credit" name="credit" className="field-input" placeholder="Photographer or studio" />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button type="submit" className="btn btn-secondary" disabled={isPending} aria-busy={isPending}>
              {isPending ? <Spinner label="Linking the image" /> : null}
              Add image
            </button>
          </div>

          {state.status === "error" && state.message ? (
            <Alert tone="error" className="mt-4">
              {state.message}
            </Alert>
          ) : null}
          {state.status === "success" && state.message ? (
            <Alert tone="success" className="mt-4">
              {state.message}
            </Alert>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
