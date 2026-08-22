import type { Request, RequestHandler, Response } from "express";
import * as projectService from "../services/project.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

const projectIdFrom = (req: Request) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) throw new ApiError(400, "Invalid project id", "VALIDATION_ERROR");
    return id;
};

export const createProject: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.createProject(req.body.name, req.user!.orgId);
    res.status(201).json({ data: project });
});

export const getProjects: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const projects = await projectService.getProjects(req.user!.orgId);
    res.status(200).json({ data: projects });
});

export const getProject: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.getProject(projectIdFrom(req), req.user!.orgId);
    res.status(200).json({ data: project });
});

export const updateProject: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.updateProject(projectIdFrom(req), req.body.name, req.user!.orgId);
    res.status(200).json({ data: project });
});

export const deleteProject: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    await projectService.deleteProject(projectIdFrom(req), req.user!.orgId);
    res.status(204).send();
});

export const getProjectDashboard: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const dashboard = await projectService.getProjectDashboard(projectIdFrom(req), req.user!.orgId);
    res.status(200).json({ data: dashboard });
});
