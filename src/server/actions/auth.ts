"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { authReadiness, createSession, destroySession, verifyPassword } from "@/lib/auth";
import { rateLimit, resetLimit } from "@/lib/rate-limit";
import { fieldErrors, formDataToObject, loginSchema } from "@/lib/validation";
import type { LoginState } from "@/lib/form-state";

/** A real hash so failed lookups cost the same as wrong passwords. */
const DUMMY_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

async function clientIp(): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return store.get("x-real-ip") ?? "unknown";
}

/** Only same-origin admin paths are accepted as a post-login destination. */
function safeRedirect(value: unknown): string {
  const target = typeof value === "string" ? value : "";
  if (!target.startsWith("/admin")) return "/admin";
  if (target.startsWith("//") || target.includes("://")) return "/admin";
  return target;
}

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const readiness = authReadiness();
  if (!readiness.ready) {
    return { status: "error", message: readiness.message };
  }

  const parsed = loginSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the fields below.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const ip = await clientIp();
  const limit = rateLimit(`login:${ip}`, 8, 10 * 60 * 1000);
  if (!limit.allowed) {
    return {
      status: "error",
      message: `Too many sign-in attempts. Please wait ${Math.ceil(limit.retryAfterSeconds / 60)} minute(s).`,
    };
  }

  let user = null;
  try {
    user = await prisma.adminUser.findUnique({
      where: { email: parsed.data.email.trim().toLowerCase() },
    });
  } catch (error) {
    console.error("[auth] lookup failed:", error instanceof Error ? error.message : error);
    return { status: "error", message: "The database could not be reached. Check your configuration and try again." };
  }

  const passwordOk = await verifyPassword(
    parsed.data.password,
    user?.passwordHash ?? DUMMY_HASH,
  );
  if (!user || !passwordOk) {
    return { status: "error", message: "Those details do not match an account." };
  }

  try {
    await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  } catch {
    // Not fatal — signing in should not depend on an audit field.
  }

  await createSession({ id: user.id, email: user.email, name: user.name });
  resetLimit(`login:${ip}`);

  // redirect() throws, so it must sit outside any try/catch.
  redirect(safeRedirect(formData.get("redirectTo")));
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}
