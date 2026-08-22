import { z } from "zod";

export const createProjectSchema = z.object({
    name: z.string().trim().min(1).max(120),
});

export const updateProjectSchema = createProjectSchema.partial().refine(
    (value) => Object.keys(value).length > 0,
    "At least one field must be provided",
);
