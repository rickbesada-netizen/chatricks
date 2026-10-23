import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

// One SQLite file holds the list of connected clients and their encrypted
// Google tokens. It lives wherever DATABASE_PATH points (default ./data).
// It is gitignored on purpose — it contains secrets.

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dbPath = process.env.DATABASE_PATH || "./data/client-inbox.db";
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id          TEXT PRIMARY KEY,
      email       TEXT NOT NULL,
      name        TEXT,
      tokens_enc  TEXT NOT NULL,
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL
    );
  `);
  return db;
}

export interface ClientRow {
  id: string;
  email: string;
  name: string | null;
  tokens_enc: string;
  created_at: number;
  updated_at: number;
}

export function upsertClient(row: {
  id: string;
  email: string;
  name: string | null;
  tokens_enc: string;
}): void {
  const now = Date.now();
  getDb()
    .prepare(
      `INSERT INTO clients (id, email, name, tokens_enc, created_at, updated_at)
       VALUES (@id, @email, @name, @tokens_enc, @now, @now)
       ON CONFLICT(id) DO UPDATE SET
         email = excluded.email,
         name = excluded.name,
         tokens_enc = excluded.tokens_enc,
         updated_at = excluded.updated_at`
    )
    .run({ ...row, now });
}

export function listClients(): ClientRow[] {
  return getDb()
    .prepare(`SELECT * FROM clients ORDER BY email ASC`)
    .all() as ClientRow[];
}

export function getClient(id: string): ClientRow | undefined {
  return getDb()
    .prepare(`SELECT * FROM clients WHERE id = ?`)
    .get(id) as ClientRow | undefined;
}

export function updateClientTokens(id: string, tokens_enc: string): void {
  getDb()
    .prepare(`UPDATE clients SET tokens_enc = ?, updated_at = ? WHERE id = ?`)
    .run(tokens_enc, Date.now(), id);
}

export function deleteClient(id: string): void {
  getDb().prepare(`DELETE FROM clients WHERE id = ?`).run(id);
}
