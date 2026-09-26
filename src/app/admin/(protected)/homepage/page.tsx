import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { HomepageForm } from "@/components/admin/HomepageForm";
import { Alert } from "@/components/ui/Alert";
import { getSiteData } from "@/lib/settings";

export const metadata: Metadata = { title: "Homepage" };

export default async function AdminHomepagePage() {
  const site = await getSiteData();

  return (
    <>
      <AdminPageHeader
        eyebrow="Configuration"
        title="Homepage content"
        description="The hero, brand story and visit band. Featured listings and collections are controlled from their own screens."
        actions={
          <>
            <Link href="/admin/furniture" className="btn btn-secondary">
              Choose featured pieces
            </Link>
            <Link href="/" target="_blank" className="btn btn-quiet">
              Open the homepage
            </Link>
          </>
        }
      />

      <Alert tone="info" className="mb-8" title="How the homepage is assembled">
        <ul className="list-disc space-y-1 pl-4">
          <li>
            <strong>Hero</strong> and <strong>story</strong> copy come from this screen.
          </li>
          <li>
            <strong>Featured furniture</strong> shows listings marked “Feature on the homepage” (up to six, topped up
            with the newest pieces).
          </li>
          <li>
            <strong>Collections</strong> shows collections flagged “Featured”, each using the first image of its first
            published piece.
          </li>
        </ul>
      </Alert>

      <HomepageForm settings={site.settings} highlights={site.highlights} />
    </>
  );
}
