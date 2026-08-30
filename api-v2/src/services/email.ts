import { Resend } from "resend";
import config from "../config.js";

// ── Provider abstraction ────────────────────────────────────────────
// Swap the implementation here if you ever move away from Resend.

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/** The rendered parts of an email — everything `sendEmail` needs except `to`. */
export type EmailContent = Omit<SendEmailOptions, "to">;

interface EmailProvider {
  send(options: SendEmailOptions): Promise<void>;
}

// ── Resend implementation ───────────────────────────────────────────

function createResendProvider(): EmailProvider {
  const resend = new Resend(config.RESEND_API_KEY);

  return {
    async send({ to, subject, html }) {
      const { error } = await resend.emails.send({
        from: config.EMAIL_FROM,
        to,
        subject,
        html
      });

      if (error) {
        console.error("Failed to send email via Resend:", error);
        throw new Error(`Email send failed: ${error.message}`);
      }
    }
  };
}

// ── Console implementation (development / fallback) ─────────────────

function createConsoleProvider(): EmailProvider {
  return {
    async send({ to, subject, html }) {
      console.log("[email-console]", { to, subject, html });
    }
  };
}

// ── Export a singleton based on whether an API key is configured ─────

const emailProvider: EmailProvider = config.RESEND_API_KEY ? createResendProvider() : createConsoleProvider();

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  return emailProvider.send(options);
}
