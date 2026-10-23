import z from "zod";
import { listTitleSchema } from "@betterdo/shared/validation";

export const createListSchema = z.object({
  title: listTitleSchema,
  color: z.string().optional()
});

export const updateListSchema = z.object({
  title: listTitleSchema.optional(),
  color: z.string().optional(),
  members: z.array(z.string()).optional(),
  tasks: z.array(z.string()).optional()
});

/**
 * Zod schema kept for the inferred CustomListConfig type below.
 * @public
 */
export const customListConfigSchema = z.object({
  highPriority: z.boolean().optional().default(false),
  today: z.boolean().optional().default(false),
  tomorrow: z.boolean().optional().default(false),
  overdue: z.boolean().optional().default(false),
  week: z.boolean().optional().default(false)
});

export type CustomListConfig = z.infer<typeof customListConfigSchema>;
