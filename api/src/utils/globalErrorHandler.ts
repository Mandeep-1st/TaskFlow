import type { Request, Response, NextFunction } from "express";

interface AppError extends Error {
    statusCode?: number;
    errors?: any[];
    [key: string]: any;
}

const globalErrorHandler = (err: AppError | unknown, _req: Request, res: Response, _next: NextFunction) => {
    const statusCode = (err as AppError).statusCode || 500;
    const message = (err as AppError).message || "Internal Server Error";
    const errors = (err as AppError).errors || [];

    return res.status(statusCode).json({
        success: false,
        message,
        errors,
        ...(process.env.NODE_ENV === "development" && { stack: (err as AppError).stack }),
    });
};

export { globalErrorHandler };