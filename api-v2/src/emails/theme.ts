// ── BetterDo email style guide ──────────────────────────────────────
//
// Single source of truth for the visual language of transactional emails.
// Values mirror the marketing site / app brand (see website Layout.astro
// and app theme). Keep email-safe: inline styles only, web-safe fallbacks,
// no external CSS. Extend by adding tokens here and consuming them in the
// components/templates.

export const brand = {
  name: "BetterDo",
  // Public logo asset (hosted). Used in the email header.
  logoUrl: "https://betterdo.app/icon-192x192.png"
} as const;

export const colors = {
  // Core brand blue
  brandBlueDark: "#00407F",

  // Surfaces
  pageBackground: "#f4f5f7",
  cardBackground: "#ffffff",
  border: "#e4e7eb",

  // Text
  text: "#1a2330",
  textMuted: "#5c6b7a",
  textInverse: "#ffffff"
} as const;

export const typography = {
  // A single system-font stack for the whole email. Custom fonts (like
  // Montserrat) don't reliably load in email clients, which is what makes
  // an email feel like it uses "many fonts" — different clients fall back
  // differently. Using system fonts keeps rendering consistent everywhere.
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  // Web-safe size scale (px)
  sizes: {
    heading: "24px",
    body: "16px",
    small: "13px"
  },
  lineHeight: {
    heading: "1.3",
    body: "1.6"
  },
  weight: {
    medium: "500",
    bold: "700"
  }
} as const;

export const spacing = {
  sm: "16px",
  md: "24px",
  lg: "32px"
} as const;

export const radius = {
  card: "12px",
  button: "8px"
} as const;

export const layout = {
  maxWidth: "560px"
} as const;
