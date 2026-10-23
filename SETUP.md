# Set up your own Chat Ricks (from scratch)

This is a complete, self-contained guide to running your **own** independent
copy of Chat Ricks — your own accounts, your own database, your own 100-account
limit. Nothing is shared with anyone else's instance.

It's free. You'll need: a Google account, a GitHub account, and about 30–40
minutes. No coding required — everything is done in the browser.

---

## 0. Get your own copy of the code

- If this repo was shared as a **template**: click the green **Use this
  template → Create a new repository**, name it (e.g. `my-inbox`), set it
  **Private**, Create. Now it's in your GitHub account.
- Otherwise: fork it, or create a new repo and copy these files in.

> You never edit the code for basic setup. All your settings go in environment
> variables (steps 3–4), never in the code.

---

## 1. Google Cloud — create your OAuth app (free)

1. Go to <https://console.cloud.google.com/> → create a **New Project** (name it
   anything, e.g. "My Inbox").
2. **APIs & Services → Library** → search **Gmail API** → **Enable**.
3. **APIs & Services → OAuth consent screen** (a.k.a. Google Auth Platform):
   - Click **Get started**.
   - App name = anything; User support email = your email.
   - **Audience: External** → Next.
   - Developer contact = your email → Create.
4. **Branding** (left menu) — fill these (required to publish with Gmail):
   - App name, support email, developer email.
   - **Application home page:** `https://YOUR-APP.vercel.app` *(you'll know this
     after step 2 — come back and fill it, or guess your project name now).*
   - **Privacy policy:** `https://YOUR-APP.vercel.app/privacy`
   - **Terms of service:** `https://YOUR-APP.vercel.app/terms`
   - **Authorized domains:** add `vercel.app` (or your exact app domain).
   - **Save.**
5. **Audience** → **Publish app** → confirm → status should read **In
   production**. *(This makes consent one-time; tokens won't expire. It's free
   up to 100 accounts.)*
6. **Clients** → **Create client** → **Web application**:
   - **Authorized redirect URIs → Add:** `https://YOUR-APP.vercel.app/api/auth/callback`
   - Create → **copy the Client ID and Client secret** (keep the secret private).

---

## 2. Deploy on Vercel + create the database (free)

1. Go to <https://vercel.com> → sign in with **GitHub**.
2. **Add New → Project** → **Import** your copy of the repo.
3. Set the **Project Name** (this decides your URL, e.g. `my-inbox` →
   `my-inbox.vercel.app`). Use this everywhere `YOUR-APP` appears above.
4. Add the **Environment Variables** from step 4 below, then **Deploy**.
5. After it deploys: **Storage → Create Database → Neon (Postgres)** → Free plan
   → connect it to this project. In the connect panel, set **Custom Prefix** to
   `DATABASE` so the variable is named `DATABASE_URL`.
6. **Deployments → ⋯ → Redeploy** so it picks up the database.

---

## 3. Generate your encryption key

In your browser, press **F12 → Console**, paste this, press Enter, copy the
result:

```js
btoa(String.fromCharCode.apply(null, crypto.getRandomValues(new Uint8Array(32))))
```

That's your `TOKEN_ENCRYPTION_KEY`. **Use your own — never reuse anyone else's.**

---

## 4. Environment variables (set these in Vercel → Settings → Environment Variables)

| Name | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | from step 1.6 |
| `GOOGLE_CLIENT_SECRET` | from step 1.6 (keep private) |
| `GOOGLE_REDIRECT_URI` | `https://YOUR-APP.vercel.app/api/auth/callback` |
| `APP_PASSWORD` | a password only you'll use to log in |
| `TOKEN_ENCRYPTION_KEY` | from step 3 |
| `DATABASE_URL` | added automatically by the Neon step (2.5) |

After changing env vars, **redeploy** once.

---

## 5. Connect accounts

1. Open `https://YOUR-APP.vercel.app` → log in with your `APP_PASSWORD`.
2. **+ Connect a client** → open the link (or send it to the account owner).
3. Sign in to the Google account → on "Google hasn't verified this app" click
   **Advanced → continue** (it's your own app) → **Allow**.
4. Back to the dashboard → **Refresh** → the inbox appears.

Repeat for each account (up to 100). Done.

---

## Notes

- **Only connect accounts whose owner has authorized it.** Keep consent on file.
- This instance is fully yours and isolated: tokens are encrypted in *your*
  database, behind *your* password.
- Past ~100 accounts you'd need Google's OAuth verification (an annual cost).
  Below that, it's free.
