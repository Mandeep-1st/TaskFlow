import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    prisma: {
        task: { findFirst: vi.fn() },
        orgMember: { findUnique: vi.fn() },
        taskAssignment: { findUnique: vi.fn(), create: vi.fn() },
        $transaction: vi.fn(),
    },
    emailQueue: { add: vi.fn() },
}));

vi.mock("../src/config/prisma.js", () => ({ default: mocks.prisma }));
vi.mock("../src/jobs/email.queue.js", () => ({ emailQueue: mocks.emailQueue }));

import { assignUser } from "../src/services/task.service.js";

describe("task assignment validation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.prisma.task.findFirst.mockResolvedValue({ id: 10 });
    });

    it("rejects an assignee outside the task organization", async () => {
        mocks.prisma.orgMember.findUnique.mockResolvedValue(null);

        await expect(assignUser(10, 20, 1))
            .rejects.toMatchObject({ statusCode: 400, code: "ASSIGNEE_NOT_IN_ORGANIZATION" });
        expect(mocks.prisma.taskAssignment.create).not.toHaveBeenCalled();
    });

    it("rejects a duplicate assignment", async () => {
        mocks.prisma.orgMember.findUnique.mockResolvedValue({ id: 1 });
        mocks.prisma.taskAssignment.findUnique.mockResolvedValue({ id: 99 });

        await expect(assignUser(10, 20, 1))
            .rejects.toMatchObject({ statusCode: 409, code: "ASSIGNMENT_EXISTS" });
        expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
    });

    it("creates an assignment and notification job for an organization member", async () => {
        mocks.prisma.orgMember.findUnique.mockResolvedValue({ id: 1 });
        mocks.prisma.taskAssignment.findUnique.mockResolvedValue(null);
        mocks.prisma.taskAssignment.create.mockResolvedValue({ id: 99, taskId: 10, userId: 20 });
        mocks.emailQueue.add.mockResolvedValue({ id: "job-1" });
        mocks.prisma.$transaction.mockImplementation(async (callback: (tx: any) => unknown) => callback({
            taskAssignment: { create: mocks.prisma.taskAssignment.create },
        }));

        await expect(assignUser(10, 20, 1)).resolves.toEqual({
            assignment: { id: 99, taskId: 10, userId: 20 },
            jobId: "job-1",
        });
        expect(mocks.emailQueue.add).toHaveBeenCalledWith(
            "task-assigned",
            { taskId: 10, userId: 20 },
            { attempts: 3, backoff: { type: "exponential", delay: 1000 } },
        );
    });
});
