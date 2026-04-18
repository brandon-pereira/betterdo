import z from "zod";

const validator = z.object({
  DATABASE_URL: z.url().describe("The URL of the PostgreSQL database to connect to."),
  PORT: z.coerce.number().default(4000).describe("The port on which the server will run."),
  GOOGLE_CLIENT_ID: z.string().describe("Google OAuth client ID for social login."),
  GOOGLE_CLIENT_SECRET: z.string().describe("Google OAuth client secret for social login."),
  VAPID_PUBLIC_KEY: z.string().optional().describe("VAPID public key for Web Push notifications."),
  VAPID_PRIVATE_KEY: z.string().optional().describe("VAPID private key for Web Push notifications."),
  VAPID_EMAIL: z.string().optional().describe("VAPID email for Web Push notifications."),
  SERVER_URL: z.string().optional().describe("Public server URL used for notification icons and links.")
});

const config = validator.parse(process.env);

export default config;
