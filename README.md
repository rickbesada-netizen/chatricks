# Chat Ricks — client inbox

**Ch@ricks** — manage all your clients' Gmail from one place, with their consent.

Multi-client inbox using **Google OAuth delegated access**: each client clicks
**Allow** once, and you work their inbox on their behalf (read, reply/send,
label) without ever touching their password or 2FA.

- **No passwords, no 2FA/Authenticator codes.** Google issues a revocable token
  per client. One-time consent, then silent forever.
- **Cloud-hosted, always on** — free on Vercel + Supabase (Postgres).
- Tokens are stored **encrypted** (AES-256-GCM) in your own database.

> **Consent & legality:** only connect accounts whose owner has knowingly
> authorized this. Keep your signed consent on file. Delegated OAuth is the
> sanctioned route precisely because the owner approves it on Google's own
> screen.

---

## 🚀 Fast setup (one-click deploy)

The hosting half is automated. Click this, and Vercel clones the app, **creates
the free database for you**, and asks for the keys — no manual Vercel/database
clicking:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Frickbesada-netizen%2Fchatricks&env=GOOGLE_CLIENT_ID%2CGOOGLE_CLIENT_SECRET%2CAPP_PASSWORD%2CTOKEN_ENCRYPTION_KEY&envDescription=Google%20OAuth%20keys%2C%20a%20login%20password%2C%20and%20an%20encryption%20key&envLink=https%3A%2F%2Fgithub.com%2Frickbesada-netizen%2Fchatricks%2Fblob%2Fmain%2FSETUP.md&project-name=chatricks&repository-name=chatricks&stores=%5B%7B%22type%22%3A%22postgres%22%7D%5D)

It prompts for 4 values:

| Prompt | What to paste |
|---|---|
| `GOOGLE_CLIENT_ID` | from your Google OAuth client (see below) |
| `GOOGLE_CLIENT_SECRET` | from your Google OAuth client |
| `APP_PASSWORD` | any password — it's how you'll log into your dashboard |
| `TOKEN_ENCRYPTION_KEY` | run `npm run genkey`, or paste the output of the browser snippet in SETUP.md |

You do **not** set a redirect URL or a database URL — the app figures out its
own redirect URL, and the Deploy button creates the database automatically.

**The only manual part (Google — can't be automated, it's tied to your Google
account):**
1. [console.cloud.google.com](https://console.cloud.google.com) → new project → enable **Gmail API**.
2. **OAuth consent screen** → External → fill name/emails.
3. **Branding** → add your app URL as home page, `.../privacy`, `.../terms`, and authorized domain.
4. **Audience → Publish app** (→ *In production*, free up to 100 accounts).
5. **Clients → Create client → Web application** → copy the **Client ID + secret** (these go in the Deploy prompts).
6. After deploying, copy your app's URL and add **`https://YOUR-URL/api/auth/callback`** to that client's **Authorized redirect URIs**.

Just the Google steps, as a printable checklist: **[Chat-Ricks-Google-Steps.pdf](Chat-Ricks-Google-Steps.pdf)**.
Full walk-through with screenshots: see **[SETUP.md](SETUP.md)**.

---

## Architecture

Next.js (App Router) · googleapis · Postgres (`pg`) · AES-256-GCM token encryption.
Deployed on Vercel; database is any Postgres (the Deploy button provisions one).

## Setup overview

1. **Google Cloud** — enable Gmail API, configure OAuth consent screen, create a
   Web OAuth client. (Done via the console.)
2. **Supabase** — create a free project, grab the pooled connection string.
3. **Vercel** — import this repo, set environment variables, deploy.
4. **Google** — add your Vercel callback URL as an authorized redirect URI.

### Environment variables (set these in Vercel → Project → Settings → Environment Variables)

| Variable | Where it comes from |
|---|---|
| `GOOGLE_CLIENT_ID` | Google Cloud → Clients → your OAuth client |
| `GOOGLE_CLIENT_SECRET` | same OAuth client (keep secret) |
| `GOOGLE_REDIRECT_URI` | `https://<your-app>.vercel.app/api/auth/callback` |
| `TOKEN_ENCRYPTION_KEY` | run `npm run genkey` locally, or any 32-byte base64 value |
| `DATABASE_URL` | Supabase → Database → **Connection pooling** string (port 6543) |
| `APP_PASSWORD` | a password only you know (gates the dashboard) |

Generate an encryption key without installing anything else:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

The `clients` table is created automatically on first use — no manual SQL needed.

---

## Using it

### Connect a client
1. Open your dashboard (your Vercel URL), log in with `APP_PASSWORD`.
2. Click **Connect a client**, optionally label them, **Copy link**.
3. Send that link to the client (or open it while they're with you).
4. They sign in to *their* Google account and click **Allow** once.
5. Their inbox appears in your dashboard.

### Daily use
- **All inboxes** shows the newest mail across every client.
- Click a client in the sidebar to focus just theirs.
- **Reply** sends from the client's own address, on their behalf.
- **✕** disconnects a client (removes stored tokens).

## How access works (no codes, ever)

```
Client clicks "Allow"  ──▶  Google gives Ch@ricks a refresh token
                                      │
                                      ▼
Ch@ricks silently mints short-lived access tokens as needed ──▶ Gmail API
```

In **Production** publishing mode the refresh token is long-lived — Google only
forces a re-consent if the client revokes access, changes their password, 6+
months of inactivity pass, or you add new scopes. (In **Testing** mode tokens
expire after 7 days, so switch to Production for real use.)

## Security notes

- Never commit `.env`. Secrets live only in Vercel's environment variables.
- Tokens are encrypted at rest with AES-256-GCM using `TOKEN_ENCRYPTION_KEY`.
- The dashboard is gated by `APP_PASSWORD` over HTTPS.

## Scaling past ~100 clients

100 users is Google's cap for *unverified* apps on restricted scopes. Beyond it,
submit for **OAuth verification** (includes an annual third-party CASA security
assessment). This app is built encrypted + consent-based to make that review
straightforward.

## Local development (optional)

You can still run it locally against the same Supabase database:

```bash
npm install
cp .env.example .env     # fill in values; set GOOGLE_REDIRECT_URI to
                         # http://localhost:3000/api/auth/callback and add that
                         # URI to your Google OAuth client too
npm run dev
```
