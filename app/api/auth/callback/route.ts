import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { exchangeCode, fetchProfile } from "@/lib/google";
import { encrypt } from "@/lib/crypto";
import { upsertClient } from "@/lib/db";

export const runtime = "nodejs";

// Google redirects the client here after they click Allow. We verify the CSRF
// nonce, exchange the code for tokens (incl. the long-lived refresh token),
// look up which account it is, and store it encrypted.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state");
  const err = url.searchParams.get("error");

  if (err) return html(`Consent was cancelled or failed: ${escapeHtml(err)}`);
  if (!code || !stateRaw) return html("Missing code or state.", 400);

  let state: { nonce?: string; label?: string } = {};
  try {
    state = JSON.parse(Buffer.from(stateRaw, "base64url").toString("utf8"));
  } catch {
    return html("Malformed state.", 400);
  }

  const cookieNonce = cookies().get("chatricks_oauth_nonce")?.value;
  if (!cookieNonce || !state.nonce || cookieNonce !== state.nonce) {
    return html("State check failed (please restart the connect link).", 400);
  }

  try {
    const tokens = await exchangeCode(code);
    if (!tokens.refresh_token) {
      // Happens if the account previously consented and Google didn't re-issue
      // a refresh token. The client should remove the app's access and retry.
      return html(
        "No refresh token returned. Ask the client to remove existing access " +
          "at myaccount.google.com/permissions, then open the connect link again."
      );
    }
    const profile = await fetchProfile(tokens);
    const id = crypto.createHash("sha256").update(profile.email).digest("hex");
    upsertClient({
      id,
      email: profile.email,
      name: state.label || profile.name,
      tokens_enc: encrypt(JSON.stringify(tokens)),
    });

    const res = html(
      `<h1>Connected ✓</h1><p><b>${escapeHtml(
        profile.email
      )}</b> is now linked to Ch@ricks. You can close this tab.</p>`
    );
    res.cookies.delete("chatricks_oauth_nonce");
    return res;
  } catch (e: any) {
    return html(`Could not complete connection: ${escapeHtml(e.message)}`, 500);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
      c
    ] as string)
  );
}

function html(body: string, status = 200): NextResponse {
  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
     <body style="font-family:system-ui;max-width:32rem;margin:4rem auto;padding:0 1rem;line-height:1.5">${body}</body>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } }
  ) as unknown as NextResponse;
}
