"use client";

import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) {
      window.location.href = "/";
    } else {
      setError("Wrong password");
    }
  }

  return (
    <div className="center">
      <form className="modal stack" onSubmit={submit} style={{ width: 360 }}>
        <h1 className="brand">
          Ch<span>@</span>ricks
        </h1>
        <p className="muted">Enter your dashboard password.</p>
        <input
          type="password"
          value={password}
          autoFocus
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        {error && <div style={{ color: "var(--danger)" }}>{error}</div>}
        <button className="primary" disabled={busy} type="submit">
          {busy ? "…" : "Open dashboard"}
        </button>
      </form>
    </div>
  );
}
