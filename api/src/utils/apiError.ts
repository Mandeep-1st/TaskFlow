class ApiError extends Error {
    statusCode: number;
    code: string;
    details: Record<string, unknown>;

    constructor(
        statusCode: number,
        message: string,
        code: string = "INTERNAL_ERROR",
        details: Record<string, unknown> = {},
    ) {
        super(message);
        this.name = "ApiError";
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Error.captureStackTrace?.(this, this.constructor);
    }
}

export { ApiError };
