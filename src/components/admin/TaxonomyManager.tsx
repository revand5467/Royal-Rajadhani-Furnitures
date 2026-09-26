"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { CheckboxField } from "@/components/ui/Field";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import {
  deleteCategory,
  deleteCollection,
  saveCategory,
  saveCollection,
} from "@/server/actions/taxonomy";
import { EMPTY_TAXONOMY_STATE, type TaxonomyState } from "@/lib/form-state";

export type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  blurb: string | null;
  position: number;
  productCount: number;
};

export type CollectionItem = CategoryItem & { featured: boolean };

function StateMessage({ state }: { state: TaxonomyState }) {
  if (state.status === "idle" || !state.message) return null;
  return (
    <Alert tone={state.status === "error" ? "error" : "success"} className="mt-3">
      {state.message}
    </Alert>
  );
}

function FieldErrors({ state }: { state: TaxonomyState }) {
  const errors = state.fieldErrors ?? {};
  const messages = [...new Set(Object.values(errors))];
  if (!messages.length) return null;
  return (
    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-danger-600">
      {messages.map((message) => (
        <li key={message}>{message}</li>
      ))}
    </ul>
  );
}

function RowShell({
  children,
  meta,
}: {
  children: React.ReactNode;
  meta: React.ReactNode;
}) {
  return (
    <li className="border border-sand-200 bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="min-w-0">{meta}</div>
      </div>
      <div className="mt-4">{children}</div>
    </li>
  );
}

export function CategoriesManager({ categories }: { categories: CategoryItem[] }) {
  return (
    <section aria-labelledby="categories-heading" className="space-y-5">
      <div>
        <h2 id="categories-heading" className="font-display text-2xl text-ink-950">
          Categories
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600">
          Categories are the primary way customers narrow the catalogue, and appear as filters on the collection page.
        </p>
      </div>

      <ul className="space-y-3">
        {categories.map((category) => (
          <CategoryRow key={category.id} category={category} />
        ))}
      </ul>

      <details className="border border-dashed border-sand-300 bg-sand-100 p-5">
        <summary className="cursor-pointer text-sm font-medium text-ink-900">Add a category</summary>
        <div className="mt-4">
          <TaxonomyForm kind="category" submitLabel="Create category" />
        </div>
      </details>
    </section>
  );
}

function CategoryRow({ category }: { category: CategoryItem }) {
  const [saveState, saveAction, saving] = useActionState(saveCategory, EMPTY_TAXONOMY_STATE);
  const [deleteState, deleteAction, deleting] = useActionState(deleteCategory, EMPTY_TAXONOMY_STATE);

  return (
    <RowShell
      meta={
        <>
          <p className="font-medium text-ink-950">
            {category.name}{" "}
            <span className="ml-1 text-xs font-normal text-ink-500">/{category.slug}</span>
          </p>
          <p className="mt-1 text-xs text-ink-500">
            {category.productCount} listing{category.productCount === 1 ? "" : "s"} · position {category.position}
          </p>
        </>
      }
    >
      <form action={saveAction} className="grid gap-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.6fr)_5rem_auto] sm:items-end">
        <input type="hidden" name="id" value={category.id} />
        <div>
          <label htmlFor={`cat-name-${category.id}`} className="field-label">
            Name
          </label>
          <input
            id={`cat-name-${category.id}`}
            name="name"
            defaultValue={category.name}
            required
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor={`cat-blurb-${category.id}`} className="field-label">
            Short description
          </label>
          <input
            id={`cat-blurb-${category.id}`}
            name="blurb"
            defaultValue={category.blurb ?? ""}
            placeholder="Shown as the intro on the collection page"
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor={`cat-position-${category.id}`} className="field-label">
            Order
          </label>
          <input
            id={`cat-position-${category.id}`}
            name="position"
            type="number"
            min="0"
            max="999"
            defaultValue={category.position}
            className="field-input"
          />
        </div>
        <div className="flex items-center gap-2">
          <input type="hidden" name="slug" value={category.slug} />
          <button type="submit" className="btn btn-quiet" disabled={saving} aria-busy={saving}>
            {saving ? <Spinner label="Saving the category" /> : null}
            Save
          </button>
        </div>
      </form>

      <StateMessage state={saveState} />
      <StateMessage state={deleteState} />
      <FieldErrors state={saveState} />

      <form action={deleteAction} className="mt-3">
        <input type="hidden" name="id" value={category.id} />
        <ConfirmSubmit question={`Delete the “${category.name}” category?`} confirmLabel="Delete category" pending={deleting}>
          Delete
        </ConfirmSubmit>
      </form>
    </RowShell>
  );
}

export function CollectionsManager({ collections }: { collections: CollectionItem[] }) {
  return (
    <section aria-labelledby="collections-heading" className="space-y-5">
      <div>
        <h2 id="collections-heading" className="font-display text-2xl text-ink-950">
          Collections
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600">
          Collections cut across categories — “Small spaces”, “Made to last”. Featured collections appear on the
          homepage. A listing can belong to one collection.
        </p>
      </div>

      <ul className="space-y-3">
        {collections.map((collection) => (
          <CollectionRow key={collection.id} collection={collection} />
        ))}
      </ul>

      <details className="border border-dashed border-sand-300 bg-sand-100 p-5">
        <summary className="cursor-pointer text-sm font-medium text-ink-900">Add a collection</summary>
        <div className="mt-4">
          <TaxonomyForm kind="collection" submitLabel="Create collection" />
        </div>
      </details>
    </section>
  );
}

function CollectionRow({ collection }: { collection: CollectionItem }) {
  const [saveState, saveAction, saving] = useActionState(saveCollection, EMPTY_TAXONOMY_STATE);
  const [deleteState, deleteAction, deleting] = useActionState(deleteCollection, EMPTY_TAXONOMY_STATE);

  return (
    <RowShell
      meta={
        <>
          <p className="font-medium text-ink-950">
            {collection.name} <span className="ml-1 text-xs font-normal text-ink-500">/{collection.slug}</span>
          </p>
          <p className="mt-1 text-xs text-ink-500">
            {collection.productCount} listing{collection.productCount === 1 ? "" : "s"}
            {collection.featured ? " · shown on the homepage" : ""}
          </p>
        </>
      }
    >
      <form action={saveAction} className="grid gap-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.6fr)_5rem_auto] sm:items-end">
        <input type="hidden" name="id" value={collection.id} />
        <input type="hidden" name="slug" value={collection.slug} />
        <div>
          <label htmlFor={`col-name-${collection.id}`} className="field-label">
            Name
          </label>
          <input
            id={`col-name-${collection.id}`}
            name="name"
            defaultValue={collection.name}
            required
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor={`col-blurb-${collection.id}`} className="field-label">
            Short description
          </label>
          <input
            id={`col-blurb-${collection.id}`}
            name="blurb"
            defaultValue={collection.blurb ?? ""}
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor={`col-position-${collection.id}`} className="field-label">
            Order
          </label>
          <input
            id={`col-position-${collection.id}`}
            name="position"
            type="number"
            min="0"
            max="999"
            defaultValue={collection.position}
            className="field-input"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CheckboxField label="Featured" name="featured" defaultChecked={collection.featured} />
          <button type="submit" className="btn btn-quiet" disabled={saving} aria-busy={saving}>
            {saving ? <Spinner label="Saving the collection" /> : null}
            Save
          </button>
        </div>
      </form>

      <StateMessage state={saveState} />
      <StateMessage state={deleteState} />
      <FieldErrors state={saveState} />

      <form action={deleteAction} className="mt-3">
        <input type="hidden" name="id" value={collection.id} />
        <ConfirmSubmit question={`Delete the “${collection.name}” collection?`} confirmLabel="Delete collection" pending={deleting}>
          Delete
        </ConfirmSubmit>
      </form>
    </RowShell>
  );
}

function TaxonomyForm({ kind, submitLabel }: { kind: "category" | "collection"; submitLabel: string }) {
  const [state, action, pending] = useActionState(
    kind === "category" ? saveCategory : saveCollection,
    EMPTY_TAXONOMY_STATE,
  );

  const prefix = kind === "category" ? "new-category" : "new-collection";

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.6fr)_5rem_auto] sm:items-end">
      <div>
        <label htmlFor={`${prefix}-name`} className="field-label">
          Name
        </label>
        <input id={`${prefix}-name`} name="name" required className="field-input" placeholder={kind === "category" ? "Seating" : "Small spaces"} />
      </div>
      <div>
        <label htmlFor={`${prefix}-blurb`} className="field-label">
          Short description
        </label>
        <input id={`${prefix}-blurb`} name="blurb" className="field-input" placeholder="Optional, one line" />
      </div>
      <div>
        <label htmlFor={`${prefix}-position`} className="field-label">
          Order
        </label>
        <input id={`${prefix}-position`} name="position" type="number" min="0" max="999" defaultValue={0} className="field-input" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {kind === "collection" ? <CheckboxField label="Featured" name="featured" /> : null}
        <button type="submit" className="btn btn-secondary" disabled={pending} aria-busy={pending}>
          {submitLabel}
        </button>
      </div>

      <div className="sm:col-span-4">
        <StateMessage state={state} />
        <FieldErrors state={state} />
      </div>
    </form>
  );
}
