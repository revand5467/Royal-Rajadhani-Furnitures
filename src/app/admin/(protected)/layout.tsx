import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — Rajadhani Furniture admin" },
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  // Server-side guard: the middleware already checked the cookie, this verifies
  // the account still exists and is the authority for everything below.
  const user = await requireAdmin("/admin");

  let counts = { drafts: 0, inquiries: 0 };
  try {
    const [drafts, inquiries] = await Promise.all([
      prisma.product.count({ where: { status: "DRAFT" } }),
      prisma.inquiry.count({ where: { status: "NEW" } }),
    ]);
    counts = { drafts, inquiries };
  } catch (error) {
    console.error("[admin] could not load counts:", error instanceof Error ? error.message : error);
  }

  return (
    <AdminShell user={user} counts={counts}>
      {children}
    </AdminShell>
  );
}
