import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  readSecret,
  secretProblemMessage,
  signSession,
  verifySessionToken,
  type SecretState,
} from "@/lib/session-token";

export { SESSION_COOKIE };

export type AdminUser = {
  id: string;
  email: string;
  name: string;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/** Configuration state of the admin area, surfaced in the UI instead of crashing. */
export function authReadiness(): { ready: true } | { ready: false; message: string } {
  const secret: SecretState = readSecret();
  if (!secret.ok) return { ready: false, message: secretProblemMessage(secret.reason) };
  return { ready: true };
}

export async function createSession(user: AdminUser): Promise<void> {
  const secret = readSecret();
  if (!secret.ok) throw new Error(secretProblemMessage(secret.reason));
  const token = await signSession({ sub: user.id, email: user.email }, secret.key);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Reads the session cookie and re-loads the admin from the database, so
 * deleting an account immediately revokes access instead of waiting for the
 * token to expire. Cached per request so a page can call it freely.
 */
export const getSessionUser = cache(async (): Promise<AdminUser | null> => {
  if (!authReadiness().ready) return null;
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  try {
    const user = await prisma.adminUser.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true },
    });
    return user ?? null;
  } catch (error) {
    console.error("[auth] session lookup failed:", error instanceof Error ? error.message : error);
    return null;
  }
});

/** Server-side guard for every admin page and every admin mutation. */
export async function requireAdmin(returnTo?: string): Promise<AdminUser> {
  const user = await getSessionUser();
  if (user) return user;
  const target = returnTo ? `/admin/login?next=${encodeURIComponent(returnTo)}` : "/admin/login";
  redirect(target);
}
