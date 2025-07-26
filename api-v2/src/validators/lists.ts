import z from "zod";

export const createListSchema = z.object({
  title: z.string().min(1, "Title is required"),
  color: z.string().optional()
});

export const updateListSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  color: z.string().optional(),
  members: z.array(z.string()).optional(),
  tasks: z.array(z.string()).optional()
});
