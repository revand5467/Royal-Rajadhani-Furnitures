"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ensureSettings } from "@/lib/settings";
import { storeImage, UploadError } from "@/lib/storage";
import { WEEKDAYS } from "@/lib/constants";
import {
  fieldErrors,
  formDataToObject,
  highlightSchema,
  homepageSchema,
  openingHourSchema,
  socialLinkSchema,
  storeDetailsSchema,
} from "@/lib/validation";
import { MAX_HIGHLIGHTS, MAX_SOCIAL_LINKS, type SettingsState, type SiteImageState } from "@/lib/form-state";

/**
 * Uploads a homepage/story image and returns its public URL. Called directly
 * from the client's upload button so the settings form can stay one <form>.
 */
export async function uploadSiteImage(formData: FormData): Promise<SiteImageState> {
  await requireAdmin("/admin/homepage");

  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length === 0) return { status: "error", message: "Choose an image file first." };
  if (files.length > 1) return { status: "error", message: "Upload one image at a time here." };

  try {
    const stored = await storeImage(files[0]!, "site");
    return { status: "success", message: "Image uploaded.", url: stored.url };
  } catch (error) {
    const message = error instanceof UploadError ? error.message : "That image could not be stored.";
    return { status: "error", message };
  }
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/homepage");
}

export async function saveStoreDetails(_previous: SettingsState, formData: FormData): Promise<SettingsState> {
  await requireAdmin("/admin/settings");

  const raw = formDataToObject(formData);
  const parsed = storeDetailsSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  }

  // Opening hours: one row per weekday, always all seven. The form posts an
  // `open_<day>` checkbox, so a day is closed when it is not ticked.
  const hours: Array<{ dayOfWeek: number; opens: string | null; closes: string | null; closed: boolean }> = [];
  for (let day = 0; day < 7; day += 1) {
    const openValue = raw[`open_${day}`];
    const isOpen = openValue === "on" || openValue === "true" || openValue === true;
    const parsedHour = openingHourSchema.safeParse({
      dayOfWeek: day,
      opens: isOpen ? raw[`opens_${day}`] : null,
      closes: isOpen ? raw[`closes_${day}`] : null,
      closed: !isOpen,
    });
    if (!parsedHour.success) {
      return {
        status: "error",
        message: `Check the opening hours for ${WEEKDAYS[day]}.`,
        fieldErrors: { [`opens_${day}`]: "Use a 24-hour time such as 09:30." },
      };
    }
    hours.push({
      dayOfWeek: day,
      opens: parsedHour.data.opens ?? null,
      closes: parsedHour.data.closes ?? null,
      closed: parsedHour.data.closed,
    });
  }

  // Social links: numbered rows, blanks are simply skipped.
  const socials: Array<{ platform: string; url: string }> = [];
  for (let index = 0; index < MAX_SOCIAL_LINKS; index += 1) {
    const platform = String(raw[`social_platform_${index}`] ?? "").trim();
    const url = String(raw[`social_url_${index}`] ?? "").trim();
    if (!platform && !url) continue;

    const parsedSocial = socialLinkSchema.safeParse({ platform, url });
    if (!parsedSocial.success) {
      return {
        status: "error",
        message: `Check the ${platform || "social"} link.`,
        fieldErrors: { [`social_url_${index}`]: parsedSocial.error.issues[0]?.message ?? "Invalid link." },
      };
    }
    socials.push({ platform: parsedSocial.data.platform, url: parsedSocial.data.url });
  }

  try {
    const existing = await ensureSettings();

    await prisma.$transaction([
      prisma.siteSettings.update({
        where: { id: existing.id },
        data: {
          ...parsed.data,
          // Optional fields are stored as null (or an empty string for the
          // street line) so the storefront can tell "not provided" apart from
          // "set to something".
          addressLine1: parsed.data.addressLine1 ?? "",
          addressLine2: parsed.data.addressLine2 ?? null,
          region: parsed.data.region ?? null,
          postalCode: parsed.data.postalCode ?? null,
          email: parsed.data.email ?? null,
          mapUrl: parsed.data.mapUrl ?? null,
        },
      }),
      prisma.openingHour.deleteMany({ where: { settingsId: existing.id } }),
      prisma.socialLink.deleteMany({ where: { settingsId: existing.id } }),
      prisma.openingHour.createMany({
        data: hours.map((hour, index) => ({ ...hour, settingsId: existing.id, position: index })),
      }),
      ...(socials.length
        ? [
            prisma.socialLink.createMany({
              data: socials.map((social, index) => ({ ...social, settingsId: existing.id, position: index })),
            }),
          ]
        : []),
    ]);
  } catch (error) {
    console.error("[settings] save failed:", error instanceof Error ? error.message : error);
    return { status: "error", message: "The store details could not be saved." };
  }

  refresh();
  return { status: "success", message: "Store details saved." };
}

export async function saveHomepage(_previous: SettingsState, formData: FormData): Promise<SettingsState> {
  await requireAdmin("/admin/homepage");

  const raw = formDataToObject(formData);
  const parsed = homepageSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  }

  const highlights: Array<{ title: string; body: string }> = [];
  for (let index = 0; index < MAX_HIGHLIGHTS; index += 1) {
    const title = String(raw[`highlight_title_${index}`] ?? "").trim();
    const body = String(raw[`highlight_body_${index}`] ?? "").trim();
    if (!title && !body) continue;

    const parsedHighlight = highlightSchema.safeParse({ title, body });
    if (!parsedHighlight.success) {
      return {
        status: "error",
        message: `Check highlight ${index + 1}.`,
        fieldErrors: { [`highlight_title_${index}`]: parsedHighlight.error.issues[0]?.message ?? "Invalid highlight." },
      };
    }
    highlights.push(parsedHighlight.data);
  }

  try {
    const existing = await ensureSettings();

    await prisma.$transaction([
      prisma.siteSettings.update({
        where: { id: existing.id },
        data: {
          ...parsed.data,
          heroImageUrl: parsed.data.heroImageUrl ?? null,
          heroImageAlt: parsed.data.heroImageAlt ?? null,
          storyImageUrl: parsed.data.storyImageUrl ?? null,
          storyImageAlt: parsed.data.storyImageAlt ?? null,
        },
      }),
      prisma.highlight.deleteMany({ where: { settingsId: existing.id } }),
      ...(highlights.length
        ? [
            prisma.highlight.createMany({
              data: highlights.map((highlight, index) => ({
                ...highlight,
                settingsId: existing.id,
                position: index,
              })),
            }),
          ]
        : []),
    ]);
  } catch (error) {
    console.error("[settings] homepage save failed:", error instanceof Error ? error.message : error);
    return { status: "error", message: "The homepage content could not be saved." };
  }

  refresh();
  return { status: "success", message: "Homepage content saved." };
}
