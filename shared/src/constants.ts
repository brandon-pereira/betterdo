import type { Priority } from "./types.ts";

// The single source of truth for task priority values, ordered low → high.
export const PRIORITIES = ["low", "normal", "high"] as const;

// Value/label pairs for priority selectors in the UI.
export const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" }
];
