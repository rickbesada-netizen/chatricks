import crypto from "crypto";
import { cookies } from "next/headers";

// Minimal single-operator gate for the dashboard. This is NOT multi-user auth —
// it's a shared password only you know, so the app isn't wide open if it's
// reachable on a network. The OAuth connect/callback routes are intentionally
// left ungated because the CLIENT (not you) visits them to grant consent.

export const AUTH_COOKIE = "chatricks_auth";

function expectedToken(): string {
  const pw = process.env.APP_PASSWORD;
  if (!pw) throw new Error("APP_PASSWORD is not set.");
  return crypto.createHash("sha256").update(pw).digest("base64");
}

export function makeAuthToken(password: string): string {
  return crypto.createHash("sha256").update(password).digest("base64");
}

export function passwordMatches(password: string): boolean {
  const a = Uint8Array.from(Buffer.from(makeAuthToken(password)));
  const b = Uint8Array.from(Buffer.from(expectedToken()));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function isAuthed(): boolean {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) return false;
  const a = Uint8Array.from(Buffer.from(token));
  const b = Uint8Array.from(Buffer.from(expectedToken()));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
