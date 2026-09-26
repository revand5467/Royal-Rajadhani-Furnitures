import { Alert } from "@/components/ui/Alert";

/**
 * Shown when the site cannot reach its database or the settings row is missing.
 * Rather than failing, the storefront renders with defaults and tells the
 * operator exactly what to run.
 */
export function SetupNotice() {
  return (
    <div className="container-page pt-6">
      <Alert tone="warning" title="Setup required">
        <p>
          The storefront is running on built-in placeholder content because the database has not been initialised yet.
          Run <code className="bg-warning-100 px-1 py-0.5">bun run setup</code> to create the schema, seed the sample
          catalogue and create the first admin account, then reload this page.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>
            Check <code>DATABASE_URL</code> in <code>.env</code> if the database credentials are wrong.
          </li>
          <li>
            Product photography falls back to bundled sample files in <code>public/samples</code>.
          </li>
        </ul>
      </Alert>
    </div>
  );
}
