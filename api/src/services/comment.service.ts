import prisma from "../config/prisma.js";
import { getTaskOrThrow } from "./task.service.js";
import { ApiError } from "../utils/apiError.js";

const authorSelect = { id: true, name: true, email: true };

export const createComment = async (taskId: number, content: string, userId: number, orgId: number) => {
    await getTaskOrThrow(taskId, orgId);
    return prisma.comment.create({
        data: { taskId, content, userId },
        include: { user: { select: authorSelect } },
    });
};

export const getComments = async (taskId: number, orgId: number) => {
    await getTaskOrThrow(taskId, orgId);
    return prisma.comment.findMany({
        where: { taskId },
        orderBy: { createdAt: "asc" },
        include: { user: { select: authorSelect } },
    });
};

export const deleteComment = async (commentId: number, userId: number, role: string, orgId: number) => {
    const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: { task: { include: { project: true } } },
    });
    if (!comment || comment.task.project.orgId !== orgId) {
        throw new ApiError(404, "Comment not found", "COMMENT_NOT_FOUND");
    }
    if (comment.userId !== userId && role !== "org_admin") {
        throw new ApiError(403, "Not allowed to delete this comment", "FORBIDDEN");
    }
    return prisma.comment.delete({ where: { id: commentId } });
};
