import rateLimit from "express-rate-limit";

export const authRateLimiter = rateLimit({
    windowMs: 60 * 1000,        // 1 minute window
    limit: 10,                  // 10 requests per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "Too many requests, please try again later",
        code: "RATE_LIMIT_EXCEEDED",
        details: {},
    },
});