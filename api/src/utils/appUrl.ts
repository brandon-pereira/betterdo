import config from "../config.js";

/**
 * Builds an absolute URL to a page in the frontend app. APP_URL may include a
 * base path (e.g. https://betterdo.app/app in production), which a plain
 * `new URL("/path", APP_URL)` would drop, so paths are resolved relative to it.
 */
export const appUrl = (path: string = ""): string => {
  const base = config.APP_URL.endsWith("/") ? config.APP_URL : `${config.APP_URL}/`;
  return new URL(path.replace(/^\/+/, ""), base).toString();
};
