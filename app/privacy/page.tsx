export const metadata = { title: "Privacy Policy — Ch@ricks" };

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px", lineHeight: 1.6 }}>
      <h1 className="brand">
        Ch<span>@</span>ricks
      </h1>
      <h2>Privacy Policy</h2>
      <p className="muted">Last updated: 2026</p>

      <p>
        Ch@ricks (&ldquo;the app&rdquo;) is a private tool used by its operator to
        manage email on behalf of accounts whose owners have granted access. This
        policy explains what data the app handles and how.
      </p>

      <h3>What the app accesses</h3>
      <p>
        When an account owner connects their Google account, they grant the app
        access to their Gmail (read, send, and organize messages) through
        Google&rsquo;s OAuth consent screen. The app only accesses accounts whose
        owners have explicitly authorized it, and only the Gmail data needed to
        provide the service.
      </p>

      <h3>What the app stores</h3>
      <ul>
        <li>
          <b>OAuth tokens</b> for each connected account, stored encrypted
          (AES-256-GCM) in the operator&rsquo;s private database. These let the app
          access Gmail without storing any password or two-factor codes.
        </li>
        <li>
          The connected account&rsquo;s email address and display name, for
          identification within the dashboard.
        </li>
      </ul>
      <p>
        The app does not sell data, does not share it with third parties, and does
        not use Google user data for advertising or to train any model. Google user
        data is used solely to provide the email-management features the account
        owner requested.
      </p>

      <h3>Google API Services User Data Policy</h3>
      <p>
        Ch@ricks&rsquo; use and transfer of information received from Google APIs
        adheres to the{" "}
        <a href="https://developers.google.com/terms/api-services-user-data-policy">
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements.
      </p>

      <h3>Revoking access</h3>
      <p>
        An account owner can revoke access at any time at{" "}
        <a href="https://myaccount.google.com/permissions">
          myaccount.google.com/permissions
        </a>
        , or ask the operator to disconnect the account, which deletes the stored
        tokens.
      </p>

      <h3>Contact</h3>
      <p>Questions about this policy can be sent to the app operator.</p>

      <p style={{ marginTop: 32 }}>
        <a href="/">← Back</a>
      </p>
    </main>
  );
}
