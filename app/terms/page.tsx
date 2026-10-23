export const metadata = { title: "Terms of Service — Ch@ricks" };

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px", lineHeight: 1.6 }}>
      <h1 className="brand">
        Ch<span>@</span>ricks
      </h1>
      <h2>Terms of Service</h2>
      <p className="muted">Last updated: 2026</p>

      <p>
        Ch@ricks is a private email-management tool. By connecting an account, you
        agree to these terms.
      </p>

      <h3>Authorized use</h3>
      <p>
        The app may only be used to access email accounts whose owners have
        knowingly authorized that access through Google&rsquo;s consent screen. The
        operator is responsible for holding that authorization for every connected
        account.
      </p>

      <h3>What the app does</h3>
      <p>
        Once an account owner grants consent, the app reads, sends, and organizes
        that account&rsquo;s Gmail on their behalf. It does not handle passwords or
        two-factor authentication codes.
      </p>

      <h3>No warranty</h3>
      <p>
        The app is provided &ldquo;as is,&rdquo; without warranties of any kind. The
        operator is not liable for any loss arising from its use, to the extent
        permitted by law.
      </p>

      <h3>Changes</h3>
      <p>These terms may be updated from time to time. Continued use means acceptance of the current terms.</p>

      <p style={{ marginTop: 32 }}>
        <a href="/">← Back</a>
      </p>
    </main>
  );
}
