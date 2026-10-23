import { Pool } from "pg";

// Cloud Postgres (e.g. Supabase) holds the connected clients and their
// encrypted Google tokens. The connection string comes from DATABASE_URL.
// On serverless (Vercel) we cache the pool on globalThis so we don't open a
// new pool on every invocation. Use Supabase's POOLED connection string
// (port 6543) for serverless.

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function getPool(): Pool {
  if (!global._pgPool) {
    // Accept DATABASE_URL (manual) or the variables Vercel/Neon inject
    // automatically when you create a Postgres store in the Vercel dashboard.
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL;
    if (!connectionString) {
      throw new Error(
        "No database URL set (DATABASE_URL or POSTGRES_URL). Create a Postgres store in Vercel, or set DATABASE_URL."
      );
    }
    global._pgPool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return global._pgPool;
}

let schemaReady: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = getPool()
      .query(
        `CREATE TABLE IF NOT EXISTS clients (
           id          TEXT PRIMARY KEY,
           email       TEXT NOT NULL,
           name        TEXT,
           tokens_enc  TEXT NOT NULL,
           created_at  BIGINT NOT NULL,
           updated_at  BIGINT NOT NULL
         );`
      )
      .then(() => undefined)
      .catch((e) => {
        schemaReady = null; // allow a retry on the next call
        throw e;
      });
  }
  return schemaReady;
}

export interface ClientRow {
  id: string;
  email: string;
  name: string | null;
  tokens_enc: string;
  created_at: string | number;
  updated_at: string | number;
}

export async function upsertClient(row: {
  id: string;
  email: string;
  name: string | null;
  tokens_enc: string;
}): Promise<void> {
  await ensureSchema();
  const now = Date.now();
  await getPool().query(
    `INSERT INTO clients (id, email, name, tokens_enc, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $5)
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       name = EXCLUDED.name,
       tokens_enc = EXCLUDED.tokens_enc,
       updated_at = EXCLUDED.updated_at`,
    [row.id, row.email, row.name, row.tokens_enc, now]
  );
}

export async function listClients(): Promise<ClientRow[]> {
  await ensureSchema();
  const { rows } = await getPool().query(
    `SELECT * FROM clients ORDER BY email ASC`
  );
  return rows as ClientRow[];
}

export async function getClient(id: string): Promise<ClientRow | undefined> {
  await ensureSchema();
  const { rows } = await getPool().query(
    `SELECT * FROM clients WHERE id = $1`,
    [id]
  );
  return rows[0] as ClientRow | undefined;
}

export async function updateClientTokens(
  id: string,
  tokens_enc: string
): Promise<void> {
  await ensureSchema();
  await getPool().query(
    `UPDATE clients SET tokens_enc = $1, updated_at = $2 WHERE id = $3`,
    [tokens_enc, Date.now(), id]
  );
}

export async function deleteClient(id: string): Promise<void> {
  await ensureSchema();
  await getPool().query(`DELETE FROM clients WHERE id = $1`, [id]);
}
