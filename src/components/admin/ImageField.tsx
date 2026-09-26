"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { uploadSiteImage } from "@/server/actions/settings";
import { IMAGE_ACCEPT, MAX_UPLOAD_MB_HINT } from "@/lib/admin-copy";

/**
 * Combined URL + upload control for storefront imagery (hero, story).
 * Uploads run directly from a click handler, so the surrounding settings form
 * stays a single <form> element.
 */
export function ImageField({
  label,
  urlName,
  defaultUrl,
  altName,
  defaultAlt,
  hint,
  error,
}: {
  label: string;
  urlName: string;
  defaultUrl: string | null;
  altName: string;
  defaultAlt: string | null;
  hint?: string;
  error?: string;
}) {
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = () => {
    const input = fileRef.current;
    if (!input?.files?.length) {
      setUploadError("Choose an image file first.");
      return;
    }
    const data = new FormData();
    for (const file of Array.from(input.files)) data.append("files", file);

    startTransition(async () => {
      const result = await uploadSiteImage(data);
      if (result.status === "success" && result.url) {
        setUrl(result.url);
        setUploadError(null);
        setUploaded(true);
        if (input) input.value = "";
      } else {
        setUploadError(result.message ?? "Upload failed.");
        setUploaded(false);
      }
    });
  };

  return (
    <fieldset className="border border-sand-200 p-5">
      <legend className="field-label px-1">{label}</legend>

      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-start">
        <div className="space-y-4">
          <div>
            <label htmlFor={urlName} className="field-label">
              Image URL
            </label>
            <input
              id={urlName}
              name={urlName}
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                setUploaded(false);
              }}
              placeholder="/samples/hero-living-room.jpg or https://…"
              className="field-input"
              aria-invalid={error ? true : undefined}
            />
            <p className="field-hint">
              {hint ?? "Upload a file below, or paste any https URL. Leave blank to show no photograph."}
            </p>
            {error ? <p className="field-error">{error}</p> : null}
          </div>

          <div>
            <label htmlFor={altName} className="field-label">
              Alt text
            </label>
            <input
              id={altName}
              name={altName}
              defaultValue={defaultAlt ?? ""}
              placeholder="Describe the photograph for screen readers"
              className="field-input"
            />
          </div>

          <div>
            <label htmlFor={`${urlName}-file`} className="field-label">
              Upload a replacement
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileRef}
                id={`${urlName}-file`}
                type="file"
                accept={IMAGE_ACCEPT}
                className="field-input file:mr-3 file:border-0 file:bg-ink-950 file:px-3 file:py-1.5 file:text-xs file:tracking-wide file:text-sand-50 file:uppercase"
              />
              <button type="button" onClick={upload} className="btn btn-quiet" disabled={isPending} aria-busy={isPending}>
                {isPending ? (
                  <Loader2 aria-hidden className="size-3.5 animate-spin" />
                ) : (
                  <ImagePlus aria-hidden className="size-3.5" strokeWidth={1.75} />
                )}
                {isPending ? "Uploading…" : "Upload"}
              </button>
            </div>
            <p className="field-hint">
              Max {MAX_UPLOAD_MB_HINT} MB. Files are converted to WebP and served from /media.
            </p>
            {uploadError ? <p className="field-error">{uploadError}</p> : null}
            {uploaded ? <p className="field-hint text-success-600">Uploaded — save to apply.</p> : null}
          </div>
        </div>

        <div>
          <p className="field-label">Preview</p>
          <div className="aspect-4/3 w-full overflow-hidden border border-sand-200 bg-sand-200">
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full place-items-center text-xs text-ink-500">No image</span>
            )}
          </div>
        </div>
      </div>
    </fieldset>
  );
}
