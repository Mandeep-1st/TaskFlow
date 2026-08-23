import type { JobType } from "bullmq";
import { emailDeadLetterQueue, emailQueue } from "../jobs/email.queue.js";
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


export const getAllJobs = async () => {
    const jobs = await emailQueue.getJobs(
        ["waiting", "active", "delayed", "completed", "failed"],
        0,
        -1,
        false,
    );

    return Promise.all(
        jobs.map(async (job) => {
            const status = await job.getState();
            return {
                id: job.id,
                status,
                attemptsMade: job.attemptsMade,
                data: job.data,
                failedReason: job.failedReason ?? null,
                timestamp: job.timestamp,
                processedOn: job.processedOn ?? null,
                finishedOn: job.finishedOn ?? null,
            };
        }),
    );
};

export const getDeadLetterJobs = async () => {
    const jobs = await emailDeadLetterQueue.getJobs(
        ["waiting", "active", "delayed", "completed", "failed"],
        0,
        -1,
        false,
    );

    return Promise.all(
        jobs.map(async (job) => {
            const status = await job.getState();
            return {
                id: job.id,
                status,
                data: job.data,
                timestamp: job.timestamp,
            };
        }),
    );
};