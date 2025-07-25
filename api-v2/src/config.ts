import z from "zod";

const validator = z.object({
  DATABASE_URL: z.url().describe("The URL of the PostgreSQL database to connect to."),
  PORT: z.coerce.number().default(4000).describe("The port on which the server will run."),
  GOOGLE_CLIENT_ID: z.string().describe("Google OAuth client ID for social login."),
  GOOGLE_CLIENT_SECRET: z.string().describe("Google OAuth client secret for social login.")
});

const config = validator.parse(process.env);

export default config;
