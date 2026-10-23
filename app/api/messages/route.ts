import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { listClients, getClient } from "@/lib/db";
import { gmailForClient } from "@/lib/google";

export const runtime = "nodejs";

interface MessageCard {
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

function header(headers: any[], name: string): string {
  const h = headers?.find(
    (x) => x.name?.toLowerCase() === name.toLowerCase()
  );
  return h?.value || "";
}

async function latestForClient(
  clientId: string,
  clientEmail: string,
  perClient: number
): Promise<MessageCard[]> {
  const gmail = await gmailForClient(clientId);
  const list = await gmail.users.messages.list({
    userId: "me",
    maxResults: perClient,
    labelIds: ["INBOX"],
  });
  const ids = (list.data.messages || []).map((m) => m.id!).filter(Boolean);

  const cards = await Promise.all(
    ids.map(async (id) => {
      const { data } = await gmail.users.messages.get({
        userId: "me",
        id,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date", "Message-ID"],
      });
      const headers = data.payload?.headers || [];
      return {
        clientId,
        clientEmail,
        id: data.id!,
        threadId: data.threadId!,
        messageId: header(headers, "Message-ID"),
        from: header(headers, "From"),
        subject: header(headers, "Subject") || "(no subject)",
        snippet: data.snippet || "",
        date: Number(data.internalDate || 0),
        unread: (data.labelIds || []).includes("UNREAD"),
      } as MessageCard;
    })
  );
  return cards;
}

// GET /api/messages?clientId=<id|all>&perClient=8
export async function GET(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId") || "all";
  const perClient = Math.min(
    Math.max(parseInt(url.searchParams.get("perClient") || "8", 10) || 8, 1),
    25
  );

  const targets =
    clientId === "all"
      ? (await listClients()).map((c) => ({ id: c.id, email: c.email }))
      : await (async () => {
          const c = await getClient(clientId);
          return c ? [{ id: c.id, email: c.email }] : [];
        })();

  const errors: { clientEmail: string; error: string }[] = [];
  const all: MessageCard[] = [];

  await Promise.all(
    targets.map(async (t) => {
      try {
        all.push(...(await latestForClient(t.id, t.email, perClient)));
      } catch (e: any) {
        errors.push({ clientEmail: t.email, error: e.message || "failed" });
      }
    })
  );

  all.sort((a, b) => b.date - a.date);
  return NextResponse.json({ messages: all, errors });
}
