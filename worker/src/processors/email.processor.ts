import { Queue, Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";

interface TaskAssignedEmailJob {
    taskId: number;
    userId: number;
}

const deadLetterQueue = new Queue("email-dead-letter-queue", { connection: redisConnection });

export const emailWorker = new Worker<TaskAssignedEmailJob>(
    "email-queue",
    async (job) => {
        const { taskId, userId } = job.data;
        console.log(`[MOCK EMAIL] Notifying user ${userId} about task ${taskId} assignment`);
    },
    { connection: redisConnection },
);

emailWorker.on("completed", (job) => console.log(`Job ${job.id} completed`));
emailWorker.on("failed", (job, error) => {
    console.error(`Job ${job?.id} failed: ${error.message}`);
    if (!job || job.attemptsMade < (job.opts.attempts ?? 1)) return;

    void deadLetterQueue.add("dead-letter", {
        originalJobId: job.id,
        data: job.data,
        failedReason: error.message,
        attemptsMade: job.attemptsMade,
    }, { removeOnComplete: false }).catch((queueError: unknown) => {
        console.error("Failed to enqueue dead-letter job", queueError);
    });
});
