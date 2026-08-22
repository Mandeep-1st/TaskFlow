import type { Request, Response, NextFunction } from "express";
import { treeifyError, type ZodType } from "zod";

export const validate = (schema: ZodType) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                error: "Validation failed",
                code: "VALIDATION_ERROR",
                details: treeifyError(result.error),
            });
        }

        req.body = result.data;
        next();
    };
};
