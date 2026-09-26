import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { StoreDetailsForm } from "@/components/admin/StoreDetailsForm";
import { Alert } from "@/components/ui/Alert";
import { getSiteData } from "@/lib/settings";
import { authReadiness } from "@/lib/auth";

export const metadata: Metadata = { title: "Store details" };

export default async function AdminSettingsPage() {
  const site = await getSiteData();
  const auth = authReadiness();

  return (
    <>
      <AdminPageHeader
        eyebrow="Configuration"
        title="Store details"
        description="Contact information, opening hours and social links. These feed the footer, the contact page and the visit section on the homepage."
        actions={
          <Link href="/admin/homepage" className="btn btn-secondary">
            Homepage content
          </Link>
        }
      />

      {!site.ready ? (
        <Alert tone="warning" className="mb-8" title="Showing built-in defaults">
          <p>
            The settings row has not been created yet. Saving this form creates it, or run{" "}
            <code>bun run db:seed</code> to create it together with the sample catalogue.
          </p>
        </Alert>
      ) : null}

      {!auth.ready ? (
        <Alert tone="error" className="mb-8" title="Authentication is not configured">
          <p>{auth.message} The admin area stays locked until this is set.</p>
        </Alert>
      ) : null}

      <StoreDetailsForm settings={site.settings} openingHours={site.openingHours} socialLinks={site.socialLinks} />
    </>
  );
}
