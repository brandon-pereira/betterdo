// ── Reusable branded email components ───────────────────────────────
//
// Small, composable HTML builders styled from the email style guide
// (theme.ts). Each returns an HTML string using inline styles so it
// renders consistently across email clients.

import { brand, colors, typography, spacing, radius, layout } from "./theme.js";

/** Escape user-provided values before interpolating into HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** A branded call-to-action button (solid brand blue). */
export function button(label: string, href: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:${spacing.md} 0;">
      <tr>
        <td style="border-radius:${radius.button};background-color:${colors.brandBlueDark};">
          <a href="${escapeHtml(href)}"
             style="display:inline-block;padding:9px 20px;font-family:${typography.fontFamily};font-size:${typography.sizes.small};font-weight:${typography.weight.medium};color:${colors.textInverse};text-decoration:none;border-radius:${radius.button};">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>`;
}

/** A heading line. */
export function heading(text: string): string {
  return `<h1 style="margin:0 0 ${spacing.sm};font-family:${typography.fontFamily};font-size:${typography.sizes.heading};line-height:${typography.lineHeight.heading};font-weight:${typography.weight.bold};color:${colors.text};">${escapeHtml(text)}</h1>`;
}

/** A body paragraph. Pass `muted` for smaller, secondary text. */
export function paragraph(text: string, opts: { muted?: boolean } = {}): string {
  const color = opts.muted ? colors.textMuted : colors.text;
  const size = opts.muted ? typography.sizes.small : typography.sizes.body;
  return `<p style="margin:0 0 ${spacing.sm};font-family:${typography.fontFamily};font-size:${size};line-height:${typography.lineHeight.body};color:${color};">${text}</p>`;
}

/**
 * Wrap body content in the branded shell: page background, centered card,
 * logo header and footer.
 */
export function layoutShell(options: { title: string; body: string; previewText?: string }): string {
  const { title, body, previewText } = options;
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${colors.pageBackground};">
  ${
    previewText
      ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(previewText)}</div>`
      : ""
  }
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${colors.pageBackground};padding:${spacing.lg} ${spacing.sm};">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:${layout.maxWidth};margin:0 auto;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:0 0 ${spacing.md};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <td style="padding-right:12px;vertical-align:middle;">
                    <img src="${brand.logoUrl}" width="40" height="40" alt="${brand.name}" style="display:block;border:0;border-radius:9px;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-family:${typography.fontFamily};font-size:22px;font-weight:${typography.weight.bold};color:${colors.text};">${brand.name}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background-color:${colors.cardBackground};border:1px solid ${colors.border};border-radius:${radius.card};padding:${spacing.lg};">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:${spacing.md} ${spacing.sm} 0;">
              <p style="margin:0;font-family:${typography.fontFamily};font-size:${typography.sizes.small};color:${colors.textMuted};">
                &copy; ${year} ${brand.name}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
