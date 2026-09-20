/**
 * Lightweight, feature-detecting wrapper around the Web Vibration API.
 *
 * Works on Android/Chrome (including installed PWAs). iOS Safari does not
 * implement `navigator.vibrate`, so every call is a graceful no-op there.
 *
 * Keep durations short (<= ~30ms for taps) so feedback feels crisp, not heavy.
 */

const canVibrate = (): boolean => typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

/** Named vibration patterns (ms, or [on, off, on, ...] sequences). */
export const patterns = {
  /** Light tick for taps, button presses, toggles. */
  tap: 10,
  /** Positive confirmation, e.g. completing a task. */
  success: [12, 40, 20] as number[],
  /** Destructive / failed action, e.g. delete or validation error. */
  error: [30, 40, 30] as number[],
  /** Short buzz when a drag pickup begins. */
  pickup: 15
} as const;

export type HapticPattern = keyof typeof patterns;

/**
 * Trigger a haptic vibration. Accepts a named pattern or a raw
 * duration/sequence. Safe to call anywhere — no-ops if unsupported.
 */
export const vibrate = (pattern: HapticPattern | number | number[] = "tap"): void => {
  if (!canVibrate()) return;

  const value = typeof pattern === "string" ? patterns[pattern] : pattern;

  try {
    navigator.vibrate(value);
  } catch {
    // Some browsers throw if called outside a user gesture; ignore.
  }
};

export default vibrate;
