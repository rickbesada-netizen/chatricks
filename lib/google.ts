import { google } from "googleapis";
import type { OAuth2Client, Credentials } from "google-auth-library";
import { encrypt, decrypt } from "./crypto";
import { getClient, updateClientTokens } from "./db";

// Scopes requested from each client at consent time.
//  - gmail.modify  : read, reply/send, label, archive (NOT permanent delete)
//  - openid/email/profile : so we can show which client account this is
export const SCOPES = [
  "https://www.googleapis.com/auth/gmail.modify",
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

// The redirect URI only matters for the consent + code-exchange steps. We
// derive it from the incoming request's host so nobody has to set (and keep in
// sync) a GOOGLE_REDIRECT_URI env var — set that env var only to override.
// Whatever this resolves to must be added as an Authorized redirect URI on the
// Google OAuth client.
export function redirectUriFromRequest(req: Request): string {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  const h = req.headers;
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  return `${proto}://${host}/api/auth/callback`;
}

export function makeOAuthClient(redirectUri?: string): OAuth2Client {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error(
      "Missing Google OAuth env vars (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)."
    );
  }
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    redirectUri || process.env.GOOGLE_REDIRECT_URI
  );
}

// Build the Google consent URL the client clicks once.
// access_type=offline + prompt=consent ensures we receive a refresh token.
export function consentUrl(state: string, redirectUri: string): string {
  return makeOAuthClient(redirectUri).generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
    include_granted_scopes: true,
  });
}

export async function exchangeCode(
  code: string,
  redirectUri: string
): Promise<Credentials> {
  const oauth = makeOAuthClient(redirectUri);
  const { tokens } = await oauth.getToken(code);
  return tokens;
}

// Returns a Gmail API client bound to a stored client's credentials.
// If googleapis refreshes the access token, we persist the new tokens
// (re-encrypted) so we never lose the refresh token.
export async function gmailForClient(clientId: string) {
  const row = await getClient(clientId);
  if (!row) throw new Error("Unknown client id");

  const stored = JSON.parse(decrypt(row.tokens_enc)) as Credentials;
  const oauth = makeOAuthClient();
  oauth.setCredentials(stored);

  oauth.on("tokens", (fresh) => {
    // Merge so we keep the refresh_token even when Google only returns a new
    // access_token on refresh. Persist is fire-and-forget.
    const merged: Credentials = { ...stored, ...fresh };
    updateClientTokens(clientId, encrypt(JSON.stringify(merged))).catch(() => {});
  });

  return google.gmail({ version: "v1", auth: oauth });
}

// Fetch the connected account's email + name for display/labeling.
export async function fetchProfile(
  credentials: Credentials
): Promise<{ email: string; name: string | null }> {
  const oauth = makeOAuthClient();
  oauth.setCredentials(credentials);
  const oauth2 = google.oauth2({ version: "v2", auth: oauth });
  const { data } = await oauth2.userinfo.get();
  return { email: data.email || "unknown", name: data.name || null };
}
