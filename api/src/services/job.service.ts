import { emailQueue } from "../jobs/email.queue.js";
import { ApiError } from "../utils/apiError.js";

export const getJobStatus = async (jobId: string) => {
    const job = await emailQueue.getJob(jobId);
    if (!job) throw new ApiError(404, "Job not found", "JOB_NOT_FOUND");

    const state = await job.getState();
    const status = state === "active" || state === "completed" || state === "failed" ? state : "pending";
    return {
        id: job.id,
        status,
        attemptsMade: job.attemptsMade,
        data: job.data,
        failedReason: job.failedReason ?? null,
    };
};
