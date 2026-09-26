import { SignJWT, jwtVerify } from "jose";

/**
 * Edge-safe session helpers (no Node APIs, no database access) so middleware can
 * gate `/admin/*` before any page code runs. The authoritative check — "does
 * this admin still exist?" — happens in `requireAdmin()` on the server.
 */
export const SESSION_COOKIE = "an_admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type SessionPayload = {
  sub: string;
  email: string;
};

const PLACEHOLDER_PATTERN = /(replace-with|change-me|changeme|placeholder|example|secret)/i;

export type SecretState =
  | { ok: true; key: Uint8Array }
  | { ok: false; reason: "missing" | "placeholder" | "too-short" };

export function readSecret(): SecretState {
  const raw = process.env.AUTH_SECRET?.trim();
  if (!raw) return { ok: false, reason: "missing" };
  if (PLACEHOLDER_PATTERN.test(raw)) return { ok: false, reason: "placeholder" };
  if (raw.length < 24) return { ok: false, reason: "too-short" };
  return { ok: true, key: new TextEncoder().encode(raw) };
}

export function secretProblemMessage(reason: "missing" | "placeholder" | "too-short"): string {
  switch (reason) {
    case "missing":
      return "Set AUTH_SECRET in your .env file to enable the admin area.";
    case "placeholder":
      return "AUTH_SECRET still holds an example value. Generate a real one with `openssl rand -base64 32`.";
    case "too-short":
      return "AUTH_SECRET must be at least 24 characters. Generate one with `openssl rand -base64 32`.";
  }
}

export async function signSession(payload: SessionPayload, key: Uint8Array): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(key);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const secret = readSecret();
  if (!secret.ok) return null;
  try {
    const { payload } = await jwtVerify(token, secret.key, { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string") return null;
    return { sub: payload.sub, email: typeof payload.email === "string" ? payload.email : "" };
  } catch {
    return null;
  }
}
