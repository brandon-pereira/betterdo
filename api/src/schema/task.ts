import { pgTable, uuid, varchar, boolean, timestamp, text, integer, index } from "drizzle-orm/pg-core";
import { PRIORITIES, TASK_TITLE_MAX_LENGTH } from "@betterdo/shared/constants";
import { lists } from "./list.js";
import { user } from "./auth.js";

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: TASK_TITLE_MAX_LENGTH }).notNull(),
    listId: uuid("list_id")
      .notNull()
      .references(() => lists.id, {
        onDelete: "cascade"
      }),
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    isCompleted: boolean("is_completed").notNull().default(false),
    completedAt: timestamp("completed_at"),
    // Who checked the task off; on shared lists this can differ from the creator.
    // Null for tasks completed before this was tracked.
    completedById: text("completed_by_id").references(() => user.id, { onDelete: "set null" }),
    dueDate: timestamp("due_date", { withTimezone: true }),
    notes: text("notes"),
    priority: text("priority", {
      enum: PRIORITIES
    }).default("normal"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date", precision: 3 })
      .$onUpdate(() => new Date())
      .defaultNow()
  },
  t => [
    // Tasks are almost always read per list, split by completion, in position order.
    index("tasks_list_id_is_completed_position_idx").on(t.listId, t.isCompleted, t.position),
    // Speeds up per-user aggregations (e.g. BetterDo Wrapped) that scope tasks by their creator.
    index("tasks_createdById_idx").on(t.createdById),
    // Speeds up per-user completion stats (e.g. BetterDo Wrapped).
    index("tasks_completed_by_id_idx").on(t.completedById)
  ]
);
