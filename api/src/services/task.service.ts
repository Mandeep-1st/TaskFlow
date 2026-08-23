import prisma from "../config/prisma.js";
import { ApiError } from "../utils/apiError.js";
import type { taskFilterSchema } from "../validators/task.schema.js";
import type { z } from "zod";
import { emailQueue } from "../jobs/email.queue.js";
type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
type TaskFilters = z.infer<typeof taskFilterSchema>;

const taskOrgWhere = (orgId: number) => ({ project: { is: { orgId } } });

export const getTaskOrThrow = async (id: number, orgId: number) => {
    const task = await prisma.task.findFirst({
        where: { id, ...taskOrgWhere(orgId) },
        include: {
            assignments: {
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
            },
        },
    });
    if (!task) throw new ApiError(404, "Task not found", "TASK_NOT_FOUND");
    return task;
};

const ensureProjectInOrg = async (projectId: number, orgId: number) => {
    const project = await prisma.project.findFirst({ where: { id: projectId, orgId } });
    if (!project) throw new ApiError(404, "Project not found", "PROJECT_NOT_FOUND");
};

export const createTask = async (
    input: { title: string; description?: string | null; status?: "todo" | "in_progress" | "review" | "done"; priority?: "low" | "medium" | "high" | "urgent"; dueDate?: Date | null; projectId: number },
    orgId: number,
) => {
    await ensureProjectInOrg(input.projectId, orgId);
    return prisma.task.create({ data: input });
};

export const getTasks = async (filters: TaskFilters, orgId: number) => {
    const { status, priority, assignee, dueDateFrom, dueDateTo, page, limit } = filters;
    const where = {
        ...taskOrgWhere(orgId),
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
        ...(assignee ? { assignments: { some: { userId: assignee } } } : {}),
        ...((dueDateFrom || dueDateTo) ? {
            dueDate: {
                ...(dueDateFrom ? { gte: dueDateFrom } : {}),
                ...(dueDateTo ? { lte: dueDateTo } : {}),
            },
        } : {}),
    };
    const [data, total] = await prisma.$transaction([
        prisma.task.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { id: "desc" },
            include: { assignments: { include: { user: { select: { id: true, name: true, email: true } } } } },
        }),
        prisma.task.count({ where }),
    ]);
    return { data, total, page, limit };
};

export const getTask = (id: number, orgId: number) => getTaskOrThrow(id, orgId);

export const updateTask = async (
    id: number,
    input: { title?: string; description?: string | null; status?: "todo" | "in_progress" | "review" | "done"; priority?: "low" | "medium" | "high" | "urgent"; dueDate?: Date | null; projectId?: number },
    orgId: number,
) => {
    await getTaskOrThrow(id, orgId);
    if (input.projectId) await ensureProjectInOrg(input.projectId, orgId);
    return prisma.task.update({ where: { id }, data: input });
};

export const deleteTask = async (id: number, orgId: number) => {
    await getTaskOrThrow(id, orgId);
    await prisma.task.delete({ where: { id } });
};

export const assignUser = async (taskId: number, userId: number, orgId: number) => {
    await getTaskOrThrow(taskId, orgId);
    const membership = await prisma.orgMember.findUnique({ where: { userId_orgId: { userId, orgId } } });
    if (!membership) throw new ApiError(400, "Assignee must belong to this organization", "ASSIGNEE_NOT_IN_ORGANIZATION");

    const existingAssignment = await prisma.taskAssignment.findUnique({ where: { taskId_userId: { taskId, userId } } });
    if (existingAssignment) throw new ApiError(409, "User is already assigned to this task", "ASSIGNMENT_EXISTS");
    return prisma.$transaction(async (tx:TransactionClient) => {
        const assignment = await tx.taskAssignment.create({ data: { taskId, userId } });
        //we will add this assignment as a notification to our emailQueue 
        try {
            //email_queue will only return a acceptance which notify that the job is successfully stored in redis.
            const job = await emailQueue.add(
                "task-assigned",
                { taskId, userId },
                { attempts: 3, backoff: { type: "exponential", delay: 1000 } },
            );
            return { assignment, jobId: job.id };
        } catch {
            throw new ApiError(500, "Failed to schedule notification", "ENQUEUE_FAILED");
        }
    });
};

export const unassignUser = async (taskId: number, userId: number, orgId: number) => {
    await getTaskOrThrow(taskId, orgId);
    const result = await prisma.taskAssignment.deleteMany({ where: { taskId, userId } });
    if (!result.count) throw new ApiError(404, "Task assignment not found", "ASSIGNMENT_NOT_FOUND");
};
