import type { Request, RequestHandler, Response } from "express";
import * as taskService from "../services/task.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { taskFilterSchema } from "../validators/task.schema.js";

const taskIdFrom = (req: Request) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) throw new ApiError(400, "Invalid task id", "VALIDATION_ERROR");
    return id;
};

const userIdFrom = (req: Request) => {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId < 1) throw new ApiError(400, "Invalid user id", "VALIDATION_ERROR");
    return userId;
};

export const createTask: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const task = await taskService.createTask(req.body, req.user!.orgId);
    res.status(201).json({ data: task });
});

export const getTasks: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const result = await taskService.getTasks(taskFilterSchema.parse(req.query), req.user!.orgId);
    res.status(200).json(result);
});

export const getTask: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const task = await taskService.getTask(taskIdFrom(req), req.user!.orgId);
    res.status(200).json({ data: task });
});

export const updateTask: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const task = await taskService.updateTask(taskIdFrom(req), req.body, req.user!.orgId);
    res.status(200).json({ data: task });
});

export const deleteTask: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    await taskService.deleteTask(taskIdFrom(req), req.user!.orgId);
    res.status(204).send();
});

export const assignUser: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const assignment = await taskService.assignUser(taskIdFrom(req), req.body.userId, req.user!.orgId);
    res.status(201).json({ data: assignment });
});

export const unassignUser: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    await taskService.unassignUser(taskIdFrom(req), userIdFrom(req), req.user!.orgId);
    res.status(204).send();
});
