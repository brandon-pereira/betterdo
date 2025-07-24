import { drizzle } from "drizzle-orm/node-postgres";
import config from "./config.js";

const db = drizzle(config.DATABASE_URL);

console.log("Hello from drizzle!", config);
export default db;
