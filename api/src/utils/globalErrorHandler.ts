import type { Request, Response, NextFunction } from "express";
import { ZodError, treeifyError } from "zod";

interface AppError extends Error {
    statusCode?: number;
    code?: string;
    details?: Record<string, unknown>;
}

const globalErrorHandler = (err: AppError | unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError) {
        return res.status(400).json({
            error: "Validation failed",
            code: "VALIDATION_ERROR",
            details: treeifyError(err),
        });
    }

    const statusCode = (err as AppError).statusCode || 500;
    const message = (err as AppError).message || "Internal Server Error";
    const code = (err as AppError).code || "INTERNAL_ERROR";
    const details = (err as AppError).details || {};

    return res.status(statusCode).json({
        error: message,
        code,
        details,
    });
};

export { globalErrorHandler };
