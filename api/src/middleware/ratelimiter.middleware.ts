import rateLimit from "express-rate-limit";

export const authRateLimiter = rateLimit({
    windowMs: 60 * 1000,        // 1 minute window
    limit: 10,                  // 10 requests per IP per window
    standardHeaders: true,      // adds RateLimit-* headers so clients can see their remaining quota
    legacyHeaders: false,       // disables the older X-RateLimit-* headers, standardHeaders covers it
    message: {
        error: "Too many requests, please try again later",
        code: "RATE_LIMIT_EXCEEDED",
        details: {},
    },
});