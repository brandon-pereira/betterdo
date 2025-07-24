import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

// This is a burner schema until we have a proper schema defined.
export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique()
});
