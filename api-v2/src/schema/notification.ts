import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { user } from "./auth.js";

// Queue of scheduled (delayed) push notifications. Immediate `notifier.send`
// calls do NOT touch this table — only `notifier.schedule` does. Rows are
// consumed and deleted by the scheduler poll loop once their `date` is reached.
export const scheduledNotifications = pgTable(
  "scheduled_notification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: timestamp("date", { withTimezone: true }).notNull(),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  table => [index("scheduled_notification_date_idx").on(table.date)]
);
