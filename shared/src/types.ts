import type { PRIORITIES } from "./constants.ts";

// A task's priority level. Derived from the PRIORITIES constant so the type and
// the runtime values can never drift apart.
export type Priority = (typeof PRIORITIES)[number];
