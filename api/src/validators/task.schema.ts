import { z } from "zod";

const taskFields = {
    title: z.string().trim().min(1).max(255),
    description: z.string().trim().max(5000).nullable().optional(),
    status: z.enum(["todo", "in_progress", "review", "done"]).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    dueDate: z.coerce.date().nullable().optional(),
};

export const createTaskSchema = z.object({
    ...taskFields,
    projectId: z.coerce.number().int().positive(),
});

export const updateTaskSchema = z.object({
    ...taskFields,
    projectId: z.coerce.number().int().positive().optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one field must be provided");

export const taskFilterSchema = z.object({
    status: z.enum(["todo", "in_progress", "review", "done"]).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    assignee: z.coerce.number().int().positive().optional(),
    dueDateFrom: z.coerce.date().optional(),
    dueDateTo: z.coerce.date().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
}).refine(
    (value) => !value.dueDateFrom || !value.dueDateTo || value.dueDateFrom <= value.dueDateTo,
    { message: "dueDateFrom must be before dueDateTo", path: ["dueDateFrom"] },
);

export const assignTaskSchema = z.object({
    userId: z.coerce.number().int().positive(),
});
