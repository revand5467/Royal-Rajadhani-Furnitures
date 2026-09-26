import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SetupNotice } from "@/components/site/SetupNotice";
import { getSiteData } from "@/lib/settings";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const site = await getSiteData();

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader storeName={site.settings.storeName} />
      {site.ready ? null : <SetupNotice />}
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter site={site} />
    </div>
  );
}
