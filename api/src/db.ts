import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import config from "./config.js";
import { relations } from "./schema/relations.js";

const pool = new Pool({ connectionString: config.DATABASE_URL });

// `pg` requires an 'error' listener on the pool. Idle clients can error out
// asynchronously (e.g. the DB restarts); without this listener Node treats it
// as an unhandled 'error' event and crashes the process. The pool reconnects
// on the next query.
pool.on("error", err => {
  console.error("[db] idle client error:", err.message);
});

const db = drizzle({ client: pool, relations });

export { db };
