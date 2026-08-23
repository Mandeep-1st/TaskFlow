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
        //currently we are having one job "task-assigned" otherwise we will use switch(case)
        const { taskId, userId } = job.data;
        console.log(`[MOCK EMAIL] Notifying user ${userId} about task ${taskId} assignment`);
    },
    { connection: redisConnection },
);

emailWorker.on("completed", (job) => console.log(`Job ${job.id} completed`));
emailWorker.on("failed", (job, error) => {
    console.error(`Job ${job?.id} failed: ${error.message}`);
    if (!job || job.attemptsMade < (job.opts.attempts ?? 1)) return;

    //the void will reject the promise we don't need to do anything we just add the dead job in the deadLetterQueue. 
    void deadLetterQueue.add("dead-letter", {
        originalJobId: job.id,
        data: job.data,
        failedReason: error.message,
        attemptsMade: job.attemptsMade,
    }, { removeOnComplete: false }).catch((queueError: unknown) => {
        console.error("Failed to enqueue dead-letter job", queueError);
    });
});
