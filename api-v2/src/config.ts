import z from "zod";

const validator = z.object({
  DATABASE_URL: z.url().describe("The URL of the PostgreSQL database to connect to."),
  PORT: z.coerce.number().default(4000).describe("The port on which the server will run.")
});

const config = validator.parse(process.env);

export default config;
