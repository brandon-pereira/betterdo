import { drizzle } from "drizzle-orm/node-postgres";
import config from "./config.js";
import * as authSchema from "./schema/auth.js";
import * as taskSchema from "./schema/task.js";
import * as listSchema from "./schema/list.js";

const db = drizzle(config.DATABASE_URL, {
  schema: {
    ...authSchema,
    ...taskSchema,
    ...listSchema
  }
});

export { db };
