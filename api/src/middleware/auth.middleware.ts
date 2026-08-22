import type { NextFunction, Request, RequestHandler, Response } from "express";

import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyAccessToken, type AccessToken } from "../utils/token.js";

declare global {
    namespace Express {
        interface Request {
            user?: AccessToken
        }
    }
}

export const verifyJwt: RequestHandler = asyncHandler(
    async (req: Request, _res: Response, next: NextFunction) => {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (!token) throw new ApiError(401, "Not authenticated", "NO_TOKEN");

        try {
            const decoded = verifyAccessToken(token);
            req.user = decoded;
        } catch {
            throw new ApiError(401, "Invalid or expired access token", "INVALID_ACCESS_TOKEN");
        }

        next();
    }
);
