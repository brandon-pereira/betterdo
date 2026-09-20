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

/**
 * Security notice sent whenever the account password changes, whether via
 * the "change password" form or the "forgot password" reset flow.
 */
export function passwordChangedTemplate(options: { name?: string; resetUrl: string }): EmailContent {
  const { name, resetUrl } = options;
  const greeting = name ? `Hi ${name},` : "Hi there,";

  const body = [
    heading("Your password was changed"),
    paragraph(greeting),
    paragraph(`The password for your ${brand.name} account was just changed.`),
    paragraph(
      "If you made this change, no further action is needed. If you didn't, reset your password right away to secure your account.",
      { muted: true }
    ),
    button("Reset Password", resetUrl)
  ].join("\n");

  return {
    subject: "Your password was changed",
    html: layoutShell({
      title: "Your password was changed",
      previewText: `Your ${brand.name} password was just changed.`,
      body
    })
  };
}

/** Security notice sent when a new passkey is registered on the account. */
export function passkeyAddedTemplate(options: {
  name?: string;
  passkeyName?: string;
  accountUrl: string;
}): EmailContent {
  const { name, passkeyName, accountUrl } = options;
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const label = passkeyName ? `“${passkeyName}”` : "A new passkey";

  const body = [
    heading("A passkey was added"),
    paragraph(greeting),
    paragraph(`${label} was added to your ${brand.name} account and can now be used to sign in.`),
    button("Review your account", accountUrl),
    paragraph(
      "If you didn't do this, someone else may have access to your account. Sign in and remove any passkeys you don't recognize.",
      {
        muted: true
      }
    )
  ].join("\n");

  return {
    subject: "A new passkey was added to your account",
    html: layoutShell({
      title: "A passkey was added",
      previewText: `${label} can now sign in to your ${brand.name} account.`,
      body
    })
  };
}

/** Security notice sent when a passkey is removed from the account. */
export function passkeyRemovedTemplate(options: {
  name?: string;
  passkeyName?: string;
  accountUrl: string;
}): EmailContent {
  const { name, passkeyName, accountUrl } = options;
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const label = passkeyName ? `“${passkeyName}”` : "A passkey";

  const body = [
    heading("A passkey was removed"),
    paragraph(greeting),
    paragraph(`${label} was removed from your ${brand.name} account and can no longer be used to sign in.`),
    button("Review your account", accountUrl),
    paragraph(
      "If you didn't do this, your account may be at risk. Sign in and check your remaining passkeys and password.",
      {
        muted: true
      }
    )
  ].join("\n");

  return {
    subject: "A passkey was removed from your account",
    html: layoutShell({
      title: "A passkey was removed",
      previewText: `${label} was removed from your ${brand.name} account.`,
      body
    })
  };
}
