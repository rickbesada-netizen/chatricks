import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { listClients, deleteClient } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const clients = (await listClients()).map((c) => ({
    id: c.id,
    email: c.email,
    name: c.name,
    connectedAt: c.created_at,
  }));
  return NextResponse.json({ clients });
}

// Disconnect a client (removes stored tokens on our side). The client can also
// revoke independently at myaccount.google.com/permissions.
export async function DELETE(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await req.json().catch(() => ({ id: "" }));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteClient(id);
  return NextResponse.json({ ok: true });
}
