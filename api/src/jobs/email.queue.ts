import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export interface TaskAssignedEmailJob {
    taskId: number;
    userId: number;
}

export const emailQueue = new Queue<TaskAssignedEmailJob>("email-queue", {
    connection: redisConnection,
});

export const emailDeadLetterQueue = new Queue("email-dead-letter-queue", {
    connection: redisConnection,
});
