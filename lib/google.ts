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

export function makeOAuthClient(): OAuth2Client {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } =
    process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error(
      "Missing Google OAuth env vars (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI)."
    );
  }
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

// Build the Google consent URL the client clicks once.
// access_type=offline + prompt=consent ensures we receive a refresh token.
export function consentUrl(state: string): string {
  return makeOAuthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
    include_granted_scopes: true,
  });
}

export async function exchangeCode(code: string): Promise<Credentials> {
  const oauth = makeOAuthClient();
  const { tokens } = await oauth.getToken(code);
  return tokens;
}

// Returns a Gmail API client bound to a stored client's credentials.
// If googleapis refreshes the access token, we persist the new tokens
// (re-encrypted) so we never lose the refresh token.
export function gmailForClient(clientId: string) {
  const row = getClient(clientId);
  if (!row) throw new Error("Unknown client id");

  const stored = JSON.parse(decrypt(row.tokens_enc)) as Credentials;
  const oauth = makeOAuthClient();
  oauth.setCredentials(stored);

  oauth.on("tokens", (fresh) => {
    // Merge so we keep the refresh_token even when Google only returns a new
    // access_token on refresh.
    const merged: Credentials = { ...stored, ...fresh };
    updateClientTokens(clientId, encrypt(JSON.stringify(merged)));
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
