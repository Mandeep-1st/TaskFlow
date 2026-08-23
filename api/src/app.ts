import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import swaggerUi from "swagger-ui-express";
import authRouter from "./routes/auth.route.js";
import projectRouter from "./routes/project.route.js";
import taskRouter from "./routes/task.route.js";
import commentRouter from "./routes/comment.route.js";
import jobRouter from "./routes/job.route.js";
import { ApiError } from "./utils/apiError.js";
import { swaggerSpec } from "./config/swagger.js";
import { globalErrorHandler } from "./utils/globalErrorHandler.js";
const app: Express = express();

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ limit: "16kb", extended: true }));
app.use(cookieParser());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/auth", authRouter);
app.use("/projects", projectRouter);
app.use("/tasks", taskRouter);
app.use("/tasks", commentRouter);
app.use("/jobs", jobRouter);

app.use((_req, _res, next) => next(new ApiError(404, "Route not found", "ROUTE_NOT_FOUND")));
app.use(globalErrorHandler);

export { app };
