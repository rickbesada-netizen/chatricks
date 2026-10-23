import { NextResponse } from "next/server";
import crypto from "crypto";
import { consentUrl } from "@/lib/google";

export const runtime = "nodejs";

// The client opens this link (you send it to them). It sends them to Google's
// consent screen. We set a short-lived nonce cookie to protect against CSRF;
// the callback checks it matches. An optional ?label= lets you tag who this is.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const label = url.searchParams.get("label") || "";

  const nonce = crypto.randomBytes(16).toString("hex");
  const state = Buffer.from(JSON.stringify({ nonce, label })).toString(
    "base64url"
  );

  const res = NextResponse.redirect(consentUrl(state));
  res.cookies.set("chatricks_oauth_nonce", nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600, // 10 minutes to complete consent
  });
  return res;
}
