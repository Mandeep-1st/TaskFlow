import type { RequestHandler } from "express";
import { ApiError } from "../utils/apiError.js";

export const requireRole = (...roles: string[]): RequestHandler => (req, _res, next) => {
    if (!req.user) {
        return next(new ApiError(401, "Not authenticated", "NO_TOKEN"));
    }

    if (!roles.includes(req.user.role)) {
        return next(new ApiError(403, "Forbidden", "FORBIDDEN"));
    }

    next();
};
