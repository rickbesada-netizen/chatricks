import { NextResponse } from "next/server";
import { AUTH_COOKIE, makeAuthToken, passwordMatches } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (!password || !passwordMatches(password)) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, makeAuthToken(password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(AUTH_COOKIE);
  return res;
}
