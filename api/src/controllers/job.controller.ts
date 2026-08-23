import type { Request, RequestHandler, Response } from "express";
import { getJobStatus as getJobStatusService } from "../services/job.service.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

export const getJobStatus: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const jobId = req.params.id;
    if (typeof jobId !== "string") throw new ApiError(400, "Invalid job id", "VALIDATION_ERROR");
    const job = await getJobStatusService(jobId);
    res.status(200).json(new ApiResponse(200, job));
});
