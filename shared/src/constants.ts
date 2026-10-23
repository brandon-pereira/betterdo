import type { Priority } from "./types.ts";

// The single source of truth for task priority values, ordered low → high.
export const PRIORITIES = ["low", "normal", "high"] as const;

// Max title lengths. These back both the DB `varchar` column sizes and the Zod
// schemas in validation.ts, so changing one here updates the API, DB and app.
export const TASK_TITLE_MAX_LENGTH = 255;
export const LIST_TITLE_MAX_LENGTH = 255;

// Value/label pairs for priority selectors in the UI.
export const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" }
];
