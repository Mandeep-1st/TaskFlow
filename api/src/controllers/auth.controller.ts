import type { Request, RequestHandler, Response } from "express";
import * as authService from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

const refreshCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/auth",
};

export const register: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    res.status(201).json({ data: result });
});

export const login: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    res.cookie("refreshToken", result.refreshToken, refreshCookieOptions);
    const { refreshToken: _refreshToken, ...response } = result;
    res.status(200).json({ data: response });
});

export const refresh: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) throw new ApiError(401, "Refresh token is required", "REFRESH_TOKEN_MISSING");
    const result = await authService.refresh(refreshToken);
    res.status(200).json({ data: result });
});

export const logout: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) throw new ApiError(401, "Refresh token is required", "REFRESH_TOKEN_MISSING");
    await authService.logout(refreshToken, req.user!.userId);
    res.clearCookie("refreshToken", refreshCookieOptions);
    res.status(200).json({ data: { message: "Logged out successfully" } });
});

export const addMember: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const membership = await authService.addMember(req.body, req.user!.orgId);
    res.status(201).json({ data: membership });
});
