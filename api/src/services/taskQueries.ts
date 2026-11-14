import { sql } from "drizzle-orm";

// `created_at` / `completed_at` are UTC `timestamp` columns; this converts one
// to the user's local time so it can be bucketed by local day or hour.
export const toLocalTime = (column: "created_at" | "completed_at", timeZone: string) =>
  sql`(${sql.raw(column)} AT TIME ZONE 'UTC' AT TIME ZONE ${timeZone})`;

// Tasks the user checked off. Completions from before completed_by_id was
// tracked fall back to the task's creator.
export const completedByUser = (userId: string) =>
  sql`completed_at IS NOT NULL
    AND (completed_by_id = ${userId} OR (completed_by_id IS NULL AND created_by_id = ${userId}))`;
