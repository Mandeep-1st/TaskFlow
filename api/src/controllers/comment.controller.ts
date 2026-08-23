import type { Request, RequestHandler, Response } from "express";
import * as commentService from "../services/comment.service.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const positiveId = (value: unknown, field: string) => {
    if (typeof value !== "string") throw new ApiError(400, `Invalid ${field}`, "VALIDATION_ERROR");
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) throw new ApiError(400, `Invalid ${field}`, "VALIDATION_ERROR");
    return id;
};

export const createComment: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const comment = await commentService.createComment(
        positiveId(req.params.taskId, "task id"),
        req.body.content,
        req.user!.userId,
        req.user!.orgId,
    );
    res.status(201).json(new ApiResponse(201, comment, "Comment created successfully"));
});

export const getComments: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const comments = await commentService.getComments(positiveId(req.params.taskId, "task id"), req.user!.orgId);
    res.status(200).json(new ApiResponse(200, comments));
});

export const deleteComment: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    await commentService.deleteComment(
        positiveId(req.params.commentId, "comment id"),
        req.user!.userId,
        req.user!.role,
        req.user!.orgId,
    );
    res.status(200).json(new ApiResponse(200, null, "Comment deleted successfully"));
});
