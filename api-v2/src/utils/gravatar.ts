import { createHash } from "crypto";

/**
 * Generates a Gravatar URL for a given email address using SHA256 hash
 * @param email - The email address to generate the Gravatar for
 * @param sizeInPx - The size of the image in pixels (default 256)
 * @returns The Gravatar URL
 */
export const getGravatarUrl = (email?: string | null, sizeInPx: number = 256): string | undefined => {
  if (!email || typeof email !== "string") {
    return undefined;
  }

  // Normalize email: lowercase and trim
  const normalizedEmail = email.toLowerCase().trim();

  // SHA256 hash of the email, converted to base64
  const hash = createHash("sha256").update(normalizedEmail).digest("hex");

  // Return Gravatar URL with size parameter and identicon default avatar
  return `https://www.gravatar.com/avatar/${hash}?s=${sizeInPx}&d=retro`;
};
