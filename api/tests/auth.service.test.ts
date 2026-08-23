import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    prisma: {
        user: { findUnique: vi.fn() },
        refreshToken: { create: vi.fn() },
        $transaction: vi.fn(),
    },
    bcrypt: { hash: vi.fn(), compare: vi.fn() },
}));

vi.mock("../src/config/prisma.js", () => ({ default: mocks.prisma }));
vi.mock("bcrypt", () => ({ default: mocks.bcrypt }));

import { login, register } from "../src/services/auth.service.js";
import { generateAccessToken, generateRefreshToken } from "../src/utils/token.js";

describe("auth service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.JWT_ACCESS_TOKEN_SECRET = "unit-test-access-secret";
        process.env.JWT_REFRESH_TOKEN_SECRET = "unit-test-refresh-secret";
    });

    it("hashes the registration password with cost factor 12", async () => {
        mocks.prisma.user.findUnique.mockResolvedValue(null);
        mocks.bcrypt.hash.mockResolvedValue("hashed-password");
        mocks.prisma.$transaction.mockImplementation(async (callback: (tx: any) => unknown) => callback({
            user: { create: vi.fn().mockResolvedValue({ id: 1, name: "Mina", email: "mina@example.com" }) },
            organization: { create: vi.fn().mockResolvedValue({ id: 2, name: "Acme" }) },
            orgMember: { create: vi.fn().mockResolvedValue({}) },
        }));

        await register({ name: "Mina", email: "mina@example.com", password: "password123", organizationName: "Acme" });

        expect(mocks.bcrypt.hash).toHaveBeenCalledWith("password123", 12);
    });

    it("rejects a duplicate registration email", async () => {
        mocks.prisma.user.findUnique.mockResolvedValue({ id: 1 });

        await expect(register({ name: "Mina", email: "mina@example.com", password: "password123", organizationName: "Acme" }))
            .rejects.toMatchObject({ statusCode: 409, code: "EMAIL_EXISTS" });
        expect(mocks.bcrypt.hash).not.toHaveBeenCalled();
    });

    it("rejects login when password comparison fails", async () => {
        mocks.prisma.user.findUnique.mockResolvedValue({
            id: 1,
            email: "mina@example.com",
            name: "Mina",
            password: "hashed-password",
            memberships: [{ orgId: 2, role: "member" }],
        });
        mocks.bcrypt.compare.mockResolvedValue(false);

        await expect(login({ email: "mina@example.com", password: "wrong-password" }))
            .rejects.toMatchObject({ statusCode: 401, code: "INVALID_CREDENTIALS" });
    });

    it("generates access and refresh tokens containing the expected payload", () => {
        const accessPayload = { userId: 1, orgId: 2, role: "org_admin" };
        const refreshPayload = { userId: 1, orgId: 2 };

        expect(jwt.decode(generateAccessToken(accessPayload))).toMatchObject(accessPayload);
        expect(jwt.decode(generateRefreshToken(refreshPayload))).toMatchObject(refreshPayload);
    });
});
