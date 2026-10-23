"use client";

import { useCallback, useEffect, useState } from "react";

interface Client {
  id: string;
  email: string;
  name: string | null;
  connectedAt: number;
}
interface Message {
  clientId: string;
  clientEmail: string;
  id: string;
  threadId: string;
  messageId: string;
  from: string;
  subject: string;
  snippet: string;
  date: number;
  unread: boolean;
}

export default function Dashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selected, setSelected] = useState<string>("all");
  const [messages, setMessages] = useState<Message[]>([]);
  const [errors, setErrors] = useState<{ clientEmail: string; error: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [label, setLabel] = useState("");

  const [reply, setReply] = useState<Message | null>(null);

  const loadClients = useCallback(async () => {
    const res = await fetch("/api/clients");
    if (res.ok) setClients((await res.json()).clients);
  }, []);

  const loadMessages = useCallback(async (clientId: string) => {
    setLoading(true);
    const res = await fetch(`/api/messages?clientId=${encodeURIComponent(clientId)}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
      setErrors(data.errors || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);
  useEffect(() => {
    loadMessages(selected);
  }, [selected, loadMessages]);

  async function logout() {
    await fetch("/api/login", { method: "DELETE" });
    window.location.href = "/login";
  }

  async function disconnect(id: string, email: string) {
    if (!confirm(`Disconnect ${email}? Ch@ricks will stop accessing this inbox.`)) return;
    await fetch("/api/clients", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await loadClients();
    if (selected === id) setSelected("all");
    else loadMessages(selected);
  }

  const connectLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/auth/connect${
          label ? `?label=${encodeURIComponent(label)}` : ""
        }`
      : "";

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1 className="brand">
          Ch<span>@</span>ricks
        </h1>
        <button className="primary" style={{ width: "100%" }} onClick={() => setAddOpen(true)}>
          + Connect a client
        </button>
        <div style={{ height: 16 }} />
        <div
          className={`client-item ${selected === "all" ? "active" : ""}`}
          onClick={() => setSelected("all")}
        >
          <span>All inboxes</span>
          <span className="badge">{clients.length}</span>
        </div>
        {clients.map((c) => (
          <div
            key={c.id}
            className={`client-item ${selected === c.id ? "active" : ""}`}
            onClick={() => setSelected(c.id)}
            title={c.email}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {c.name || c.email}
            </span>
            <button
              className="danger"
              style={{ padding: "2px 6px", fontSize: 11 }}
              onClick={(e) => {
                e.stopPropagation();
                disconnect(c.id, c.email);
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </aside>

      <main className="main">
        <div className="toolbar">
          <strong>
            {selected === "all"
              ? "All inboxes"
              : clients.find((c) => c.id === selected)?.email || ""}
          </strong>
          <span className="spacer" />
          <button onClick={() => loadMessages(selected)}>Refresh</button>
          <button onClick={logout}>Log out</button>
        </div>

        {clients.length === 0 && (
          <div className="card">
            <p>No clients connected yet.</p>
            <p className="muted">
              Click <b>Connect a client</b>, then send the generated link to your client.
              They click <b>Allow</b> once and their inbox appears here.
            </p>
          </div>
        )}

        {errors.map((e) => (
          <div key={e.clientEmail} className="card" style={{ borderColor: "var(--danger)" }}>
            <b>{e.clientEmail}</b>: {e.error}
            <div className="muted" style={{ fontSize: 12 }}>
              If this says the token is invalid, the client may need to re-connect.
            </div>
          </div>
        ))}

        {loading && <p className="muted">Loading…</p>}

        {!loading &&
          messages.map((m) => (
            <div key={`${m.clientId}:${m.id}`} className={`card ${m.unread ? "unread" : ""}`}>
              <div className="row">
                <div className="muted" style={{ fontSize: 13 }}>{m.from}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {selected === "all" && <span className="badge">{m.clientEmail}</span>}
                  <span className="muted" style={{ fontSize: 12 }}>
                    {new Date(m.date).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="subject">{m.subject}</div>
              <div className="snippet">{m.snippet}</div>
              <div style={{ marginTop: 10 }}>
                <button onClick={() => setReply(m)}>Reply</button>
              </div>
            </div>
          ))}

        {!loading && clients.length > 0 && messages.length === 0 && (
          <p className="muted">No messages in the inbox(es).</p>
        )}
      </main>

      {addOpen && (
        <div className="modal-bg" onClick={() => setAddOpen(false)}>
          <div className="modal stack" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Connect a client</h2>
            <p className="muted">
              Optionally label who this is, then copy the link and send it to your client.
              When they click <b>Allow</b> on Google&apos;s screen, their inbox shows up here.
            </p>
            <input
              placeholder="Label (e.g. Jane's Plumbing) — optional"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <input readOnly value={connectLink} onFocus={(e) => e.target.select()} />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="primary"
                onClick={() => {
                  navigator.clipboard?.writeText(connectLink);
                }}
              >
                Copy link
              </button>
              <a href={connectLink} target="_blank" rel="noreferrer">
                <button>Open it myself</button>
              </a>
              <span className="spacer" />
              <button onClick={() => setAddOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {reply && (
        <ReplyModal
          message={reply}
          onClose={() => setReply(null)}
          onSent={() => {
            setReply(null);
            loadMessages(selected);
          }}
        />
      )}
    </div>
  );
}

function ReplyModal({
  message,
  onClose,
  onSent,
}: {
  message: Message;
  onClose: () => void;
  onSent: () => void;
}) {
  // Parse a bare email out of a "Name <email>" From header.
  const to = (message.from.match(/<(.+?)>/)?.[1] || message.from).trim();
  const subject = message.subject.startsWith("Re:")
    ? message.subject
    : `Re: ${message.subject}`;
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function send() {
    setBusy(true);
    setErr("");
    const res = await fetch("/api/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        clientId: message.clientId,
        to,
        subject,
        body,
        threadId: message.threadId,
        inReplyTo: message.messageId || undefined,
        references: message.messageId || undefined,
      }),
    });
    setBusy(false);
    if (res.ok) onSent();
    else setErr((await res.json()).error || "Send failed");
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal stack" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>Reply</h2>
        <div className="muted" style={{ fontSize: 13 }}>
          From <b>{message.clientEmail}</b> → {to}
        </div>
        <input readOnly value={subject} />
        <textarea
          rows={8}
          autoFocus
          placeholder="Write your reply…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        {err && <div style={{ color: "var(--danger)" }}>{err}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="primary" disabled={busy || !body.trim()} onClick={send}>
            {busy ? "Sending…" : "Send on their behalf"}
          </button>
          <span className="spacer" />
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
