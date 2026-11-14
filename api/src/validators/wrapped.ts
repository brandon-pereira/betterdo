import z from "zod";

// Body for QUERY /api/wrapped: `{ all: true }`, `{ year: 2026 }` or `{ year: 2026, month: 10 }`.
// The year defaults to the current one.
export const wrappedPeriodSchema = z.union([
  z.strictObject({ all: z.literal(true) }),
  // Strict so a malformed `all` is rejected instead of falling back to the current year.
  z.strictObject({
    year: z.number().int().min(2000).max(2100).optional(),
    month: z.number().int().min(1).max(12).optional()
  })
]);

export type WrappedPeriod = z.infer<typeof wrappedPeriodSchema>;
