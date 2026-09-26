"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { TextField } from "@/components/ui/Field";
import { saveStoreDetails } from "@/server/actions/settings";
import { EMPTY_SETTINGS_STATE, MAX_SOCIAL_LINKS } from "@/lib/form-state";
import { WEEKDAYS, WEEKDAY_ORDER } from "@/lib/constants";
import type { StoreSettings } from "@/lib/settings";

type SocialLink = { platform: string; url: string };

export function StoreDetailsForm({
  settings,
  openingHours,
  socialLinks,
}: {
  settings: StoreSettings;
  openingHours: Array<{ dayOfWeek: number; opens: string | null; closes: string | null; closed: boolean }>;
  socialLinks: SocialLink[];
}) {
  const [state, formAction, isPending] = useActionState(saveStoreDetails, EMPTY_SETTINGS_STATE);
  const errors = state.fieldErrors ?? {};

  const [socials, setSocials] = useState<SocialLink[]>(() => {
    const initial = socialLinks.length ? [...socialLinks] : [{ platform: "", url: "" }];
    while (initial.length < 3) initial.push({ platform: "", url: "" });
    return initial.slice(0, MAX_SOCIAL_LINKS);
  });

  const hoursByDay = new Map(openingHours.map((hour) => [hour.dayOfWeek, hour]));

  return (
    <form action={formAction} className="space-y-10" noValidate>
      {state.status === "error" && state.message ? <Alert tone="error">{state.message}</Alert> : null}
      {state.status === "success" && state.message ? <Alert tone="success">{state.message}</Alert> : null}

      <section className="border border-sand-200 bg-white p-6" aria-labelledby="identity-heading">
        <h2 id="identity-heading" className="font-display text-xl text-ink-950">
          Identity
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <TextField label="Store name" name="storeName" required defaultValue={settings.storeName} error={errors.storeName} />
          <TextField
            label="Tagline"
            name="tagline"
            required
            defaultValue={settings.tagline}
            error={errors.tagline}
            hint="Shown above the hero headline."
          />
          <div className="sm:col-span-2">
            <label htmlFor="footerBlurb" className="field-label">
              Footer description
            </label>
            <textarea
              id="footerBlurb"
              name="footerBlurb"
              rows={3}
              defaultValue={settings.footerBlurb}
              className="field-input resize-y"
              aria-invalid={errors.footerBlurb ? true : undefined}
            />
            {errors.footerBlurb ? <p className="field-error">{errors.footerBlurb}</p> : null}
          </div>
        </div>
      </section>

      <section className="border border-sand-200 bg-white p-6" aria-labelledby="contact-heading">
        <h2 id="contact-heading" className="font-display text-xl text-ink-950">
          Address &amp; contact
        </h2>
        <p className="mt-2 text-sm text-ink-600">
          Only the shop name, city, region, country and phone are required. Street address, second line, postal code and
          email can be left blank — blank fields are hidden on the storefront.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <TextField
            label="Street address (optional)"
            name="addressLine1"
            defaultValue={settings.addressLine1}
            error={errors.addressLine1}
            hint="Leave blank if you would rather not publish a street address."
          />
          <TextField label="Second line (optional)" name="addressLine2" defaultValue={settings.addressLine2 ?? ""} error={errors.addressLine2} />
          <TextField label="City" name="city" required defaultValue={settings.city} error={errors.city} />
          <TextField label="Region / state (optional)" name="region" defaultValue={settings.region ?? ""} error={errors.region} />
          <TextField label="Postal code (optional)" name="postalCode" defaultValue={settings.postalCode ?? ""} error={errors.postalCode} />
          <TextField label="Country" name="country" required defaultValue={settings.country} error={errors.country} />
          <TextField label="Phone" name="phone" required type="tel" inputMode="tel" defaultValue={settings.phone} error={errors.phone} />
          <TextField
            label="Email (optional)"
            name="email"
            type="email"
            inputMode="email"
            defaultValue={settings.email}
            error={errors.email}
            hint="Leave blank if the shop has no public email address."
          />
          <div className="sm:col-span-2">
            <TextField
              label="Map link (optional)"
              name="mapUrl"
              type="url"
              inputMode="url"
              defaultValue={settings.mapUrl ?? ""}
              error={errors.mapUrl}
              hint="Any https link — Google Maps, OpenStreetMap or Apple Maps."
            />
          </div>
        </div>
      </section>

      <section className="border border-sand-200 bg-white p-6" aria-labelledby="hours-heading">
        <h2 id="hours-heading" className="font-display text-xl text-ink-950">
          Opening hours
        </h2>
        <p className="mt-2 text-sm text-ink-600">
          Use 24-hour times, for example <code>09:30</code>. Untick “Open” for days the showroom is closed.
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            <caption className="sr-only">Opening hours for each day of the week</caption>
            <thead>
              <tr className="border-b border-sand-200 text-left">
                <th scope="col" className="field-label py-2">
                  Day
                </th>
                <th scope="col" className="field-label py-2">
                  Opens
                </th>
                <th scope="col" className="field-label py-2">
                  Closes
                </th>
                <th scope="col" className="field-label py-2">
                  Open
                </th>
              </tr>
            </thead>
            <tbody>
              {WEEKDAY_ORDER.map((day) => {
                const hour = hoursByDay.get(day);
                return (
                  <tr key={day} className="border-b border-sand-100">
                    <th scope="row" className="py-3 pr-4 text-left font-normal text-ink-800">
                      {WEEKDAYS[day]}
                    </th>
                    <td className="py-3 pr-4">
                      <input
                        id={`opens_${day}`}
                        name={`opens_${day}`}
                        type="time"
                        defaultValue={hour?.opens ?? ""}
                        className="field-input w-32"
                        aria-label={`${WEEKDAYS[day]} opening time`}
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        id={`closes_${day}`}
                        name={`closes_${day}`}
                        type="time"
                        defaultValue={hour?.closes ?? ""}
                        className="field-input w-32"
                        aria-label={`${WEEKDAYS[day]} closing time`}
                      />
                    </td>
                    <td className="py-3">
                      <label className="inline-flex items-center gap-2 text-xs text-ink-600">
                        <input
                          type="checkbox"
                          name={`open_${day}`}
                          defaultChecked={Boolean(hour && !hour.closed && hour.opens && hour.closes)}
                          className="size-4 accent-clay-600"
                        />
                        <span className="sr-only">{WEEKDAYS[day]} is open</span>
                        Open
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border border-sand-200 bg-white p-6" aria-labelledby="social-heading">
        <h2 id="social-heading" className="font-display text-xl text-ink-950">
          Social links
        </h2>
        <p className="mt-2 text-sm text-ink-600">
          Shown in the footer. Leave a row empty to remove it from the site.
        </p>

        <ul className="mt-5 space-y-4">
          {socials.map((social, index) => (
            <li key={index} className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] sm:items-end">
              <div>
                <label htmlFor={`social_platform_${index}`} className="field-label">
                  Network
                </label>
                <input
                  id={`social_platform_${index}`}
                  name={`social_platform_${index}`}
                  defaultValue={social.platform}
                  placeholder="Instagram"
                  className="field-input"
                />
              </div>
              <div>
                <label htmlFor={`social_url_${index}`} className="field-label">
                  Profile URL
                </label>
                <input
                  id={`social_url_${index}`}
                  name={`social_url_${index}`}
                  defaultValue={social.url}
                  placeholder="https://instagram.com/yourshop"
                  className="field-input"
                  aria-invalid={errors[`social_url_${index}`] ? true : undefined}
                />
                {errors[`social_url_${index}`] ? (
                  <p className="field-error">{errors[`social_url_${index}`]}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setSocials((list) => list.filter((_, i) => i !== index))}
                className="btn btn-quiet"
              >
                <Trash2 aria-hidden className="size-3.5" strokeWidth={1.75} />
                Remove
                <span className="sr-only"> {social.platform || `link ${index + 1}`}</span>
              </button>
            </li>
          ))}
        </ul>

        {socials.length < MAX_SOCIAL_LINKS ? (
          <button
            type="button"
            onClick={() => setSocials((list) => [...list, { platform: "", url: "" }])}
            className="btn btn-quiet mt-4"
          >
            <Plus aria-hidden className="size-3.5" strokeWidth={1.75} />
            Add another link
          </button>
        ) : (
          <p className="field-hint mt-4">Up to {MAX_SOCIAL_LINKS} links.</p>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={isPending} aria-busy={isPending}>
          {isPending ? (
            <>
              <Spinner label="Saving store details" />
              Saving…
            </>
          ) : (
            "Save store details"
          )}
        </button>
        <p className="text-xs text-ink-500">Changes appear across the storefront immediately.</p>
      </div>
    </form>
  );
}
