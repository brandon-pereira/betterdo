import { pgTable, uuid, varchar, boolean, jsonb, timestamp, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { lists } from "./list.js";
import { user } from "./auth.js";

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),

  title: varchar("title", { length: 100 }).notNull(),

  listId: uuid("list_id")
    .notNull()
    .references(() => lists.id, {
      onDelete: "cascade"
    }),

  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id),

  isCompleted: boolean("is_completed").notNull().default(false),

  dueDate: timestamp("due_date", { withTimezone: true }),

  notes: text("notes"),

  subtasks: jsonb("subtasks").default([]).notNull(), // Array of { title: string; isComplete: boolean }

  priority: text("priority", {
    enum: ["low", "normal", "high"]
  })
    .notNull()
    .default("normal"),

  creationDate: timestamp("creation_date", {
    withTimezone: true
  })
    .notNull()
    .defaultNow()
});

export const tasksRelations = relations(tasks, ({ one }) => ({
  list: one(lists, {
    fields: [tasks.listId],
    references: [lists.id]
  }),
  createdBy: one(user, {
    fields: [tasks.createdById],
    references: [user.id]
  })
}));
