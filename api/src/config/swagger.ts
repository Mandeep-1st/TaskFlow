import swaggerJSDoc from "swagger-jsdoc";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const routeDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "routes");
const routeNames = ["auth", "project", "task", "comment", "job"];
const routeFiles = routeNames.flatMap((name) => [
    join(routeDirectory, `${name}.route.ts`),
    join(routeDirectory, `${name}.route.js`),
]).map((file) => file.replaceAll("\\", "/"));

export const swaggerSpec = swaggerJSDoc({
    definition: {
        openapi: "3.0.3",
        info: {
            title: "TaskFlow API",
            version: "1.0.0",
            description: "Multi-tenant project-management API.",
        },
        servers: [{ url: "http://localhost:3000", description: "Local development" },{url:process.env.BACKEND_URL, description:"Production"}],
        components: {
            securitySchemes: {
                bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
            },
            schemas: {
                Error: {
                    type: "object",
                    required: ["error", "code", "details"],
                    properties: {
                        error: { type: "string", example: "Task not found" },
                        code: { type: "string", example: "TASK_NOT_FOUND" },
                        details: { type: "object", additionalProperties: true },
                    },
                },
                Success: {
                    type: "object",
                    required: ["data", "statusCode", "message", "success"],
                    properties: {
                        data: {},
                        statusCode: { type: "integer", example: 200 },
                        message: { type: "string", example: "Success" },
                        success: { type: "boolean", example: true },
                    },
                },
                ProjectInput: {
                    type: "object",
                    required: ["name"],
                    properties: { name: { type: "string", minLength: 1, maxLength: 120 } },
                },
                ProjectUpdateInput: {
                    type: "object",
                    minProperties: 1,
                    properties: { name: { type: "string", minLength: 1, maxLength: 120 } },
                },
                TaskInput: {
                    type: "object",
                    required: ["title", "projectId"],
                    properties: {
                        title: { type: "string", minLength: 1, maxLength: 255 },
                        description: { type: "string", maxLength: 5000, nullable: true },
                        status: { type: "string", enum: ["todo", "in_progress", "review", "done"] },
                        priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
                        dueDate: { type: "string", format: "date-time", nullable: true },
                        projectId: { type: "integer", minimum: 1 },
                    },
                },
                TaskUpdateInput: {
                    type: "object",
                    minProperties: 1,
                    properties: {
                        title: { type: "string", minLength: 1, maxLength: 255 },
                        description: { type: "string", maxLength: 5000, nullable: true },
                        status: { type: "string", enum: ["todo", "in_progress", "review", "done"] },
                        priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
                        dueDate: { type: "string", format: "date", nullable: true },
                        projectId: { type: "integer", minimum: 1 },
                    },
                },
            },
        },
    },
    apis: routeFiles,
});
