# Chat Ricks — client inbox

**Ch@ricks** — manage all your clients' Gmail from one place, with their consent.

Manage multiple clients' Gmail from one dashboard, using **Google OAuth
delegated access** — each client clicks **Allow** once, and you work their
inbox on their behalf (read, reply/send, label) without ever touching their
password or 2FA.

- **No passwords, no 2FA/Authenticator codes.** Google issues your app a
  revocable token per client. One-time consent, then silent forever.
- **Free to run** for up to ~100 clients (Google's unverified-app cap).
- **Runs locally** by default. Tokens are stored encrypted in a local SQLite
  file that never leaves your machine.

> **Consent & legality:** only connect accounts whose owner has knowingly
> authorized this. Keep your signed consent on file. Google can suspend
> accounts used in ways their owners didn't agree to — delegated OAuth is the
> sanctioned route precisely because the owner approves it on Google's own
> screen.

---

## 1. One-time Google setup (free)

1. Go to <https://console.cloud.google.com/> → create a project (e.g. "Chat Ricks").
2. **APIs & Services → Library →** enable the **Gmail API**.
3. **APIs & Services → OAuth consent screen:**
   - User type: **External**.
   - Fill app name, your email, developer contact.
   - **Scopes:** add `.../auth/gmail.modify` (plus `openid`, `userinfo.email`,
     `userinfo.profile`).
   - **Publishing status:** click **Publish app** → set to **In production**.
     (This is what makes consent *one-time* — in "Testing" mode refresh tokens
     expire after 7 days. Production + unverified is free and gives long-lived
     tokens; clients just click past a one-time "unverified app" warning.)
4. **APIs & Services → Credentials → Create credentials → OAuth client ID:**
   - Type: **Web application**.
   - **Authorized redirect URIs:** add exactly
     `http://localhost:3000/api/auth/callback`
     (and your real https URL later if you deploy).
   - Copy the **Client ID** and **Client secret**.

---

## 2. Configure the app

```bash
cp .env.example .env
npm install
npm run genkey          # prints a 32-byte key — paste it as TOKEN_ENCRYPTION_KEY
```

Edit `.env`:

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from step 1.4
- `GOOGLE_REDIRECT_URI` — leave as `http://localhost:3000/api/auth/callback` for local
- `TOKEN_ENCRYPTION_KEY` — the value from `npm run genkey`
- `APP_PASSWORD` — a password only you know (gates the dashboard)

---

## 3. Run

```bash
npm run dev
```

Open <http://localhost:3000>, enter your `APP_PASSWORD`.

### Connect a client
1. Click **Connect a client**, optionally label them, **Copy link**.
2. Send that link to the client (or open it yourself while they're with you).
3. They sign in to *their* Google account and click **Allow** once.
4. Their inbox appears in your dashboard. Done — you won't need to ask again.

### Daily use
- **All inboxes** shows the newest mail across every client.
- Click a client in the sidebar to focus just theirs.
- **Reply** sends from the client's own address, on their behalf.
- **✕** next to a client disconnects them (removes stored tokens).

---

## How access works (no codes, ever)

```
Client clicks "Allow"  ──▶  Google gives Ch@ricks a refresh token
                                      │
                                      ▼
Ch@ricks silently mints short-lived access tokens as needed ──▶ Gmail API
```

The refresh token is long-lived in Production mode. Google only forces a
re-consent if the client revokes access, changes their password, 6+ months of
inactivity pass, or you add new scopes.

## Security notes

- `.env` and the `*.db` file are gitignored — **never commit them**. They hold
  your client secret and the (encrypted) client tokens.
- Tokens are encrypted at rest with AES-256-GCM using `TOKEN_ENCRYPTION_KEY`.
- The dashboard is gated by `APP_PASSWORD`. If you deploy this on the public
  internet, put it behind HTTPS and consider stronger auth.

## Scaling past ~100 clients

The 100-user limit is Google's cap for *unverified* apps on restricted scopes.
To go beyond it, submit the app for **OAuth verification** (includes a
third-party CASA security assessment — an annual cost). This app is built
encrypted + consent-based from day one to make that review straightforward.

## Tech

Next.js (App Router) · googleapis · better-sqlite3 · AES-256-GCM token encryption.
