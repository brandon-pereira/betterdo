import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { sql } from "drizzle-orm";
import { vi, beforeAll, afterAll, afterEach } from "vitest";
import * as authSchema from "../../src/schema/auth.js";
import * as taskSchema from "../../src/schema/task.js";
import * as listSchema from "../../src/schema/list.js";

let client: PGlite;

const schema = {
  ...authSchema,
  ...taskSchema,
  ...listSchema
};

// Create PGlite client and drizzle instance
client = new PGlite();
const testDb = drizzle({ client, schema });

// Mock the db module so all service imports use our PGlite-backed db
vi.mock("../../src/db.js", () => ({
  db: testDb
}));

// Set timezone for consistent date tests
process.env.TZ = "America/Edmonton";

export { testDb };

beforeAll(async () => {
  // Create all tables using raw SQL (matching the Drizzle schema)
  await testDb.execute(sql`
    CREATE TABLE IF NOT EXISTS "user" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "email_verified" BOOLEAN NOT NULL DEFAULT false,
      "image" TEXT,
      "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,
      "time_zone" TEXT NOT NULL DEFAULT 'America/New_York',
      "custom_lists" JSONB,
      "is_beta" BOOLEAN DEFAULT false,
      "is_push_enabled" BOOLEAN DEFAULT false,
      "vapid_key" TEXT
    )
  `);

  await testDb.execute(sql`
    CREATE TABLE IF NOT EXISTS "session" (
      "id" TEXT PRIMARY KEY,
      "expires_at" TIMESTAMP NOT NULL,
      "token" TEXT NOT NULL UNIQUE,
      "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,
      "ip_address" TEXT,
      "user_agent" TEXT,
      "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
    )
  `);

  await testDb.execute(sql`
    CREATE TABLE IF NOT EXISTS "account" (
      "id" TEXT PRIMARY KEY,
      "account_id" TEXT NOT NULL,
      "provider_id" TEXT NOT NULL,
      "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "access_token" TEXT,
      "refresh_token" TEXT,
      "id_token" TEXT,
      "access_token_expires_at" TIMESTAMP,
      "refresh_token_expires_at" TIMESTAMP,
      "scope" TEXT,
      "password" TEXT,
      "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  await testDb.execute(sql`
    CREATE TABLE IF NOT EXISTS "verification" (
      "id" TEXT PRIMARY KEY,
      "identifier" TEXT NOT NULL,
      "value" TEXT NOT NULL,
      "expires_at" TIMESTAMP NOT NULL,
      "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  await testDb.execute(sql`
    CREATE TABLE IF NOT EXISTS "passkey" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT,
      "public_key" TEXT NOT NULL,
      "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "credential_id" TEXT NOT NULL,
      "counter" INTEGER NOT NULL,
      "device_type" TEXT NOT NULL,
      "backed_up" BOOLEAN NOT NULL,
      "transports" TEXT,
      "created_at" TIMESTAMP,
      "aaguid" TEXT
    )
  `);

  await testDb.execute(sql`
    CREATE TABLE IF NOT EXISTS "push_subscription" (
      "id" TEXT PRIMARY KEY,
      "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "endpoint" TEXT NOT NULL,
      "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  await testDb.execute(sql`
    CREATE TABLE IF NOT EXISTS "tasks" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "title" VARCHAR(100) NOT NULL,
      "list_id" UUID NOT NULL,
      "created_by_id" TEXT NOT NULL REFERENCES "user"("id"),
      "is_completed" BOOLEAN NOT NULL DEFAULT false,
      "due_date" TIMESTAMP WITH TIME ZONE,
      "notes" TEXT,
      "subtasks" JSONB,
      "priority" TEXT DEFAULT 'normal',
      "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMP(3) DEFAULT NOW()
    )
  `);

  await testDb.execute(sql`
    CREATE TABLE IF NOT EXISTS "list" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "title" VARCHAR(255) NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'default',
      "color" VARCHAR(64) NOT NULL DEFAULT '#666666',
      "created_by_id" TEXT NOT NULL REFERENCES "user"("id"),
      "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMP(3) DEFAULT NOW()
    )
  `);

  await testDb.execute(sql`
    CREATE TABLE IF NOT EXISTS "list_member" (
      "list_id" UUID NOT NULL REFERENCES "list"("id"),
      "user_id" TEXT NOT NULL REFERENCES "user"("id"),
      PRIMARY KEY ("user_id", "list_id")
    )
  `);

  await testDb.execute(sql`
    CREATE TABLE IF NOT EXISTS "list_tasks" (
      "list_id" UUID NOT NULL REFERENCES "list"("id"),
      "task_id" UUID NOT NULL REFERENCES "tasks"("id")
    )
  `);

  // Add foreign key for tasks -> list after list table exists
  await testDb.execute(sql`
    ALTER TABLE "tasks" ADD CONSTRAINT "tasks_list_id_list_id_fk"
    FOREIGN KEY ("list_id") REFERENCES "list"("id") ON DELETE CASCADE
  `);
});

afterAll(async () => {
  await client.close();
});
