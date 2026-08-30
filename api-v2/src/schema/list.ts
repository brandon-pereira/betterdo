// drizzle/schema/list.ts
import { pgTable, text, uuid, varchar, timestamp, primaryKey, integer } from "drizzle-orm/pg-core";
import { user } from "./auth.js";
import { tasks } from "./task.js";

export const lists = pgTable("list", {
  id: uuid("id").primaryKey().defaultRandom(), // or use text if you're storing Mongo _id strings
  title: varchar("title", { length: 255 }).notNull(),
  type: text("type", {
    enum: ["inbox", "default"]
  })
    .notNull()
    .default("default"),
  color: varchar("color", { length: 64 }).notNull().default("#666666"),
  createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(), // Unix timestamp
  updatedAt: timestamp("updated_at", { mode: "date", precision: 3 })
    .$onUpdate(() => new Date())
    .defaultNow()
});

// You'll need to create join tables for lists ↔ users (members) and lists ↔ tasks
export const listMembers = pgTable(
  "list_member",
  {
    listId: uuid("list_id")
      .notNull()
      .references(() => lists.id),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0)
  },
  t => [primaryKey({ columns: [t.userId, t.listId] })]
);

export const listTasks = pgTable("list_tasks", {
  listId: uuid("list_id")
    .notNull()
    .references(() => lists.id),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id)
});
