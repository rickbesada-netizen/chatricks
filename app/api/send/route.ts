import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { getClient } from "@/lib/db";
import { gmailForClient } from "@/lib/google";

export const runtime = "nodejs";

function buildRaw(opts: {
  from: string;
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  references?: string;
}): string {
  const lines = [
    `From: ${opts.from}`,
    `To: ${opts.to}`,
    `Subject: ${opts.subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
  ];
  if (opts.inReplyTo) lines.push(`In-Reply-To: ${opts.inReplyTo}`);
  if (opts.references) lines.push(`References: ${opts.references}`);
  lines.push("", opts.body);
  return Buffer.from(lines.join("\r\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// POST /api/send  { clientId, to, subject, body, threadId?, inReplyTo?, references? }
// Sends FROM the connected client's account (on their behalf).
export async function POST(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => null);
  if (!b?.clientId || !b?.to || !b?.body) {
    return NextResponse.json(
      { error: "clientId, to and body are required" },
      { status: 400 }
    );
  }

  const client = getClient(b.clientId);
  if (!client) return NextResponse.json({ error: "unknown client" }, { status: 404 });

  try {
    const gmail = gmailForClient(b.clientId);
    const raw = buildRaw({
      from: client.email,
      to: b.to,
      subject: b.subject || "(no subject)",
      body: b.body,
      inReplyTo: b.inReplyTo,
      references: b.references,
    });
    const { data } = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw, threadId: b.threadId || undefined },
    });
    return NextResponse.json({ ok: true, id: data.id, threadId: data.threadId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "send failed" }, { status: 500 });
  }
}
