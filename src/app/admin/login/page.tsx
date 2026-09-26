import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/admin/LoginForm";
import { Alert } from "@/components/ui/Alert";
import { authReadiness } from "@/lib/auth";
import { databaseReachable, prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

type PageProps = { searchParams: Promise<{ next?: string }> };

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const redirectTo = params.next?.startsWith("/admin") ? params.next : "/admin";

  const readiness = authReadiness();
  const dbReady = readiness.ready ? await databaseReachable() : false;

  let adminCount: number | null = null;
  let accountError = false;
  if (readiness.ready && dbReady) {
    try {
      adminCount = await prisma.adminUser.count();
    } catch {
      accountError = true;
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-14 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="font-display text-xl text-ink-950">
            Rajadhani Furniture
            <span className="mt-1 block text-xs tracking-[0.18em] text-ink-500 uppercase">Admin</span>
          </Link>

          <h1 className="mt-10 font-display text-3xl text-ink-950">Sign in</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-600">
            The admin area manages listings, images, categories and inquiries. Public visitors cannot reach it.
          </p>

          <div className="mt-8 space-y-4">
            {!readiness.ready ? (
              <Alert tone="warning" title="Authentication is not configured">
                <p>{readiness.message}</p>
              </Alert>
            ) : null}

            {readiness.ready && !dbReady ? (
              <Alert tone="warning" title="Database unavailable">
                <p>
                  The database could not be reached. Confirm <code>DATABASE_URL</code> in <code>.env</code>, then run{" "}
                  <code>bun run setup</code>.
                </p>
              </Alert>
            ) : null}

            {readiness.ready && dbReady && accountError ? (
              <Alert tone="error" title="Could not read accounts">
                <p>The admin table is missing. Run the migrations with `bun run db:migrate`.</p>
              </Alert>
            ) : null}

            {readiness.ready && dbReady && adminCount === 0 ? (
              <Alert tone="info" title="No admin account yet">
                <p>
                  Create one from the project directory:
                  <br />
                  <code className="mt-1 block bg-sand-200 px-2 py-1 text-xs">bun run admin:create</code>
                  It reads <code>SEED_ADMIN_EMAIL</code> and <code>SEED_ADMIN_PASSWORD</code> from <code>.env</code>.
                </p>
              </Alert>
            ) : null}

            {readiness.ready && dbReady ? <LoginForm redirectTo={redirectTo} /> : null}
          </div>

          <p className="mt-10 text-xs text-ink-500">
            <Link href="/" className="underline underline-offset-4 hover:text-ink-800">
              ← Back to the storefront
            </Link>
          </p>
        </div>
      </div>

      <div
        aria-hidden
        className="hidden bg-ink-950 bg-[radial-gradient(circle_at_30%_20%,rgba(180,98,47,0.35),transparent_55%),radial-gradient(circle_at_75%_75%,rgba(71,82,63,0.4),transparent_50%)] lg:block"
      />
    </div>
  );
}
