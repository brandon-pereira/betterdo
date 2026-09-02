import z from "zod";

const validator = z.object({
  DATABASE_URL: z.url().describe("The URL of the PostgreSQL database to connect to."),
  PORT: z.coerce.number().default(4000).describe("The port on which the server will run."),
  GOOGLE_CLIENT_ID: z.string().describe("Google OAuth client ID for social login."),
  GOOGLE_CLIENT_SECRET: z.string().describe("Google OAuth client secret for social login."),
  VAPID_PUBLIC_KEY: z.string().optional().describe("VAPID public key for Web Push notifications."),
  VAPID_PRIVATE_KEY: z.string().optional().describe("VAPID private key for Web Push notifications."),
  VAPID_EMAIL: z.string().optional().describe("VAPID email for Web Push notifications."),
  SERVER_URL: z
    .string()
    .default("http://localhost:4000")
    .describe("Public URL of this API server. Used for notification icons/links and as the BetterAuth base URL."),
  APP_URL: z
    .string()
    .default("http://localhost:4001")
    .describe("Public URL of the frontend app, used for post-verification redirects."),
  WEBSITE_URL: z.string().default("http://localhost:4002").describe("Public URL of the marketing website."),
  RESEND_API_KEY: z.string().optional().describe("Resend API key for sending transactional emails."),
  EMAIL_FROM: z
    .string()
    .default("BetterDo <onboarding@betterdo.app>")
    .describe("The 'from' address used for outbound emails.")
});

const config = validator.parse(process.env);

// BetterAuth reads process.env.BETTER_AUTH_URL to build its base URL (and the
// Google OAuth redirect_uri: `${BETTER_AUTH_URL}/api/auth/callback/google`).
// Default it to SERVER_URL so the API only needs one canonical URL, while still
// letting an explicit BETTER_AUTH_URL override it.
process.env.BETTER_AUTH_URL ||= config.SERVER_URL;

export default config;
