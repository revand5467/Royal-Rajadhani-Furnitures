/**
 * Shared form state for `useActionState`.
 *
 * These live outside the `"use server"` action modules on purpose: a module
 * marked `"use server"` may only export async functions, so constants and
 * types are kept here and imported by both the actions and the client forms.
 */

export type LoginState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const EMPTY_LOGIN_STATE: LoginState = { status: "idle" };

export type InquiryFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const EMPTY_INQUIRY_STATE: InquiryFormState = { status: "idle" };

export type ProductFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  savedAt?: number;
};

export const EMPTY_PRODUCT_STATE: ProductFormState = { status: "idle" };

export type UploadState = {
  status: "idle" | "success" | "error";
  message?: string;
  uploaded?: number;
  failures?: string[];
};

export const EMPTY_UPLOAD_STATE: UploadState = { status: "idle" };

export type SiteImageState = {
  status: "idle" | "success" | "error";
  message?: string;
  url?: string;
};

export const EMPTY_SITE_IMAGE_STATE: SiteImageState = { status: "idle" };

export type TaxonomyState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const EMPTY_TAXONOMY_STATE: TaxonomyState = { status: "idle" };

export type SettingsState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const EMPTY_SETTINGS_STATE: SettingsState = { status: "idle" };

/** Repeatable-row limits used by the store details and homepage forms. */
export const MAX_SOCIAL_LINKS = 6;
export const MAX_HIGHLIGHTS = 4;
