"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { TextField } from "@/components/ui/Field";
import { ImageField } from "@/components/admin/ImageField";
import { saveHomepage } from "@/server/actions/settings";
import { EMPTY_SETTINGS_STATE, MAX_HIGHLIGHTS } from "@/lib/form-state";
import type { StoreSettings } from "@/lib/settings";

type Highlight = { title: string; body: string };

export function HomepageForm({
  settings,
  highlights,
}: {
  settings: StoreSettings;
  highlights: Highlight[];
}) {
  const [state, formAction, isPending] = useActionState(saveHomepage, EMPTY_SETTINGS_STATE);
  const errors = state.fieldErrors ?? {};

  const [items, setItems] = useState<Highlight[]>(() => {
    const initial = highlights.length ? [...highlights] : [{ title: "", body: "" }];
    return initial.slice(0, MAX_HIGHLIGHTS);
  });

  return (
    <form action={formAction} className="space-y-10" noValidate>
      {state.status === "error" && state.message ? <Alert tone="error">{state.message}</Alert> : null}
      {state.status === "success" && state.message ? <Alert tone="success">{state.message}</Alert> : null}

      <section className="border border-sand-200 bg-white p-6" aria-labelledby="hero-heading">
        <h2 id="hero-heading" className="font-display text-xl text-ink-950">
          Hero
        </h2>
        <div className="mt-5 space-y-5">
          <TextField
            label="Headline"
            name="heroHeadline"
            required
            defaultValue={settings.heroHeadline}
            error={errors.heroHeadline}
          />
          <div>
            <label htmlFor="heroSubhead" className="field-label">
              Supporting copy
            </label>
            <textarea
              id="heroSubhead"
              name="heroSubhead"
              rows={3}
              defaultValue={settings.heroSubhead}
              className="field-input resize-y"
              aria-invalid={errors.heroSubhead ? true : undefined}
            />
            {errors.heroSubhead ? <p className="field-error">{errors.heroSubhead}</p> : null}
          </div>
          <ImageField
            label="Hero image"
            urlName="heroImageUrl"
            defaultUrl={settings.heroImageUrl}
            altName="heroImageAlt"
            defaultAlt={settings.heroImageAlt}
            error={errors.heroImageUrl}
          />
        </div>
      </section>

      <section className="border border-sand-200 bg-white p-6" aria-labelledby="story-heading">
        <h2 id="story-heading" className="font-display text-xl text-ink-950">
          Brand story
        </h2>
        <div className="mt-5 space-y-5">
          <TextField label="Heading" name="storyHeading" required defaultValue={settings.storyHeading} error={errors.storyHeading} />
          <div>
            <label htmlFor="storyBody" className="field-label">
              Story
            </label>
            <textarea
              id="storyBody"
              name="storyBody"
              rows={10}
              defaultValue={settings.storyBody}
              className="field-input resize-y"
              aria-invalid={errors.storyBody ? true : undefined}
            />
            <p className="field-hint">
              Leave a blank line between paragraphs. Shown on the homepage and at the top of the About page.
            </p>
            {errors.storyBody ? <p className="field-error">{errors.storyBody}</p> : null}
          </div>
          <ImageField
            label="Story image"
            urlName="storyImageUrl"
            defaultUrl={settings.storyImageUrl}
            altName="storyImageAlt"
            defaultAlt={settings.storyImageAlt}
            error={errors.storyImageUrl}
          />
        </div>
      </section>

      <section className="border border-sand-200 bg-white p-6" aria-labelledby="visit-heading">
        <h2 id="visit-heading" className="font-display text-xl text-ink-950">
          Visit band
        </h2>
        <p className="mt-2 text-sm text-ink-600">
          The closing call to action on the homepage. The address and hours come from Store details.
        </p>
        <div className="mt-5 space-y-5">
          <TextField label="Heading" name="visitHeading" required defaultValue={settings.visitHeading} error={errors.visitHeading} />
          <div>
            <label htmlFor="visitBody" className="field-label">
              Supporting copy
            </label>
            <textarea
              id="visitBody"
              name="visitBody"
              rows={3}
              defaultValue={settings.visitBody}
              className="field-input resize-y"
              aria-invalid={errors.visitBody ? true : undefined}
            />
            {errors.visitBody ? <p className="field-error">{errors.visitBody}</p> : null}
          </div>
        </div>
      </section>

      <section className="border border-sand-200 bg-white p-6" aria-labelledby="highlights-heading">
        <h2 id="highlights-heading" className="font-display text-xl text-ink-950">
          Highlights
        </h2>
        <p className="mt-2 text-sm text-ink-600">
          Short reassurances shown beneath the hero. Between one and {MAX_HIGHLIGHTS}.
        </p>

        <ul className="mt-5 space-y-5">
          {items.map((highlight, index) => (
            <li key={index} className="border border-sand-200 bg-sand-50 p-4">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <div>
                  <label htmlFor={`highlight_title_${index}`} className="field-label">
                    Heading
                  </label>
                  <input
                    id={`highlight_title_${index}`}
                    name={`highlight_title_${index}`}
                    defaultValue={highlight.title}
                    placeholder="Made in the workshop"
                    className="field-input"
                    aria-invalid={errors[`highlight_title_${index}`] ? true : undefined}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setItems((list) => list.filter((_, i) => i !== index))}
                  className="btn btn-quiet"
                >
                  <Trash2 aria-hidden className="size-3.5" strokeWidth={1.75} />
                  Remove highlight
                </button>
              </div>
              <div className="mt-4">
                <label htmlFor={`highlight_body_${index}`} className="field-label">
                  Body
                </label>
                <textarea
                  id={`highlight_body_${index}`}
                  name={`highlight_body_${index}`}
                  rows={2}
                  defaultValue={highlight.body}
                  className="field-input resize-y"
                />
              </div>
              {errors[`highlight_title_${index}`] ? (
                <p className="field-error">{errors[`highlight_title_${index}`]}</p>
              ) : null}
            </li>
          ))}
        </ul>

        {items.length < MAX_HIGHLIGHTS ? (
          <button
            type="button"
            onClick={() => setItems((list) => [...list, { title: "", body: "" }])}
            className="btn btn-quiet mt-4"
          >
            <Plus aria-hidden className="size-3.5" strokeWidth={1.75} />
            Add a highlight
          </button>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={isPending} aria-busy={isPending}>
          {isPending ? (
            <>
              <Spinner label="Saving homepage content" />
              Saving…
            </>
          ) : (
            "Save homepage"
          )}
        </button>
        <p className="text-xs text-ink-500">Empty highlight rows are removed on save.</p>
      </div>
    </form>
  );
}
