import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import { globalErrorHandler } from "./utils/globalErrorHandler.js";
const app: Express = express();

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ limit: "16kb", extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// import userRouter from "./Routes/user.route.js";

// app.use("/api/v1/users", userRouter);
app.use(globalErrorHandler);

export { app };