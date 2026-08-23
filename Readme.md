# TaskFlow Backend

## Background-job consistency

Task assignment and email-job enqueueing are performed within one Prisma transaction. If queueing the notification fails, the transaction throws and the task assignment is rolled back, preventing an assignment from being returned without its notification job.

Email jobs retry with exponential backoff. Once attempts are exhausted, the worker records the failed job payload in the `email-dead-letter-queue`; the original job remains available at `GET /jobs/:id` with a `failed` status.
