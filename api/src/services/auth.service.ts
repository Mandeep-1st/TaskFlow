import bcrypt from "bcrypt";
import prisma from "../config/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/token.js";

interface RegisterUser {
    name: string;
    email: string;
    password: string;
    organizationName: string;
}

interface LoginUser {
    email: string;
    password: string;
    orgId?: number;
}

interface AddMemberInput {
    name: string;
    email: string;
    password: string;
    role: "org_admin" | "member";
}


const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const register = async ({ name, email, password, organizationName }: RegisterUser) => {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ApiError(409, "Email already in use", "EMAIL_EXISTS");

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({ data: { name, email, password: hashedPassword } });
        const organization = await tx.organization.create({ data: { name: organizationName } });
        await tx.orgMember.create({
            data: { userId: user.id, orgId: organization.id, role: "org_admin" },
        });
        return { user, organization };
    });

    return {
        user: { id: result.user.id, name: result.user.name, email: result.user.email },
        organization: { id: result.organization.id, name: result.organization.name },
    };
};

const login = async ({ email, password, orgId }: LoginUser) => {
    const user = await prisma.user.findUnique({ where: { email }, include: { memberships: true } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const membership = user.memberships.length === 1
        ? user.memberships[0]
        : user.memberships.find((item) => item.orgId === orgId);
    if (!membership) {
        throw new ApiError(400, "Organization is required or invalid", "ORG_REQUIRED");
    }

    const accessToken = generateAccessToken({
        userId: user.id,
        orgId: membership.orgId,
        role: membership.role,
    });
    const refreshToken = generateRefreshToken({ userId: user.id, orgId: membership.orgId });
    await prisma.refreshToken.create({
        data: {
            userId: user.id,
            tokenHash: await bcrypt.hash(refreshToken, 12),
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        },
    });

    return {
        accessToken,
        refreshToken,
        user: { id: user.id, name: user.name, email: user.email },
        organizationId: membership.orgId,
        role: membership.role,
    };
};

const refresh = async (incomingToken: string) => {
    let decoded;
    try {
        decoded = verifyRefreshToken(incomingToken);
    } catch {
        throw new ApiError(401, "Invalid or expired refresh token", "INVALID_REFRESH_TOKEN");
    }

    const tokenRows = await prisma.refreshToken.findMany({
        where: { userId: decoded.userId, revoked: false, expiresAt: { gt: new Date() } },
    });
    const matchedRow = (await Promise.all(
        tokenRows.map(async (row) => ((await bcrypt.compare(incomingToken, row.tokenHash)) ? row : null)),
    )).find((row) => row !== null);
    if (!matchedRow) throw new ApiError(401, "Invalid or expired refresh token", "INVALID_REFRESH_TOKEN");

    const membership = await prisma.orgMember.findUnique({
        where: { userId_orgId: { userId: decoded.userId, orgId: decoded.orgId } },
    });
    if (!membership) throw new ApiError(403, "Organization membership no longer exists", "MEMBERSHIP_NOT_FOUND");

    return {
        accessToken: generateAccessToken({
            userId: decoded.userId,
            orgId: membership.orgId,
            role: membership.role,
        }),
    };
};

const logout = async (incomingToken: string, authenticatedUserId: number) => {
    let decoded;
    try {
        decoded = verifyRefreshToken(incomingToken);
    } catch {
        throw new ApiError(401, "Invalid or expired refresh token", "INVALID_REFRESH_TOKEN");
    }
    if (decoded.userId !== authenticatedUserId) {
        throw new ApiError(403, "Forbidden", "FORBIDDEN");
    }

    const tokenRows = await prisma.refreshToken.findMany({
        where: { userId: decoded.userId, revoked: false },
    });
    for (const row of tokenRows) {
        if (await bcrypt.compare(incomingToken, row.tokenHash)) {
            await prisma.refreshToken.update({ where: { id: row.id }, data: { revoked: true } });
            return;
        }
    }
    throw new ApiError(401, "Invalid or expired refresh token", "INVALID_REFRESH_TOKEN");
};


const addMember = async ({ name, email, password, role }: AddMemberInput, orgId: number) => {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    // check membership conflict BEFORE creating anything, so we don't create
    // a user and then fail on the membership step, leaving a user with no org
    if (existingUser) {
        const existingMembership = await prisma.orgMember.findUnique({
            where: { userId_orgId: { userId: existingUser.id, orgId } },
        });
        if (existingMembership) {
            throw new ApiError(409, "User is already an organization member", "MEMBERSHIP_EXISTS");
        }
    }

    const result = await prisma.$transaction(async (tx) => {
        const user = existingUser
            ? existingUser
            : await tx.user.create({
                data: { name, email, password: await bcrypt.hash(password, 12) },
            });

        const membership = await tx.orgMember.create({
            data: { userId: user.id, orgId, role },
        });

        return { user, membership };
    });

    return {
        workflow: existingUser ? "existing_user" : "new_user",
        passwordApplied: !existingUser, // tells the frontend whether the password it sent was actually set
        user: { id: result.user.id, name: result.user.name, email: result.user.email },
        membership: { id: result.membership.id, orgId, role: result.membership.role },
    };
};


const logoutAll = async (userId: number) => {
    await prisma.refreshToken.updateMany({ where: { userId, revoked: false }, data: { revoked: true } });
};

export { register, login, refresh, logout, addMember, logoutAll };
