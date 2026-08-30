// ── Transactional email templates ──────────────────────────────────
//
// Each template returns a `{ subject, html }` pair built from the branded
// components. Add new templates here as the app grows.

import { button, heading, layoutShell, paragraph } from "./components.js";
import { brand } from "./theme.js";
import type { EmailContent } from "../services/email.js";

/** Email asking a new user to verify their address. */
export function verifyEmailTemplate(options: { url: string; name?: string }): EmailContent {
  const { url, name } = options;
  const greeting = name ? `Hi ${name},` : "Welcome to " + brand.name + "!";

  const body = [
    heading("Verify your email"),
    paragraph(greeting),
    paragraph("Confirm your email address to finish setting up your account and start getting things done."),
    button("Verify Email", url),
    paragraph("If you didn't create a " + brand.name + " account, you can safely ignore this email.", {
      muted: true
    })
  ].join("\n");

  return {
    subject: "Verify your email address",
    html: layoutShell({
      title: "Verify your email",
      previewText: `Confirm your email to get started with ${brand.name}.`,
      body
    })
  };
}

/** Email with a link to reset the user's password. */
export function resetPasswordTemplate(options: { url: string; name?: string }): EmailContent {
  const { url, name } = options;
  const greeting = name ? `Hi ${name},` : "Hi there,";

  const body = [
    heading("Reset your password"),
    paragraph(greeting),
    paragraph("We received a request to reset your password. Click the button below to choose a new one."),
    button("Reset Password", url),
    paragraph("This link will expire soon. If you didn't request a password reset, you can safely ignore this email.", {
      muted: true
    })
  ].join("\n");

  return {
    subject: "Reset your password",
    html: layoutShell({
      title: "Reset your password",
      previewText: `Reset your ${brand.name} password.`,
      body
    })
  };
}
