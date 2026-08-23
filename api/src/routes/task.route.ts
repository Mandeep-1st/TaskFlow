import { Router } from "express";
import * as taskController from "../controllers/task.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { assignTaskSchema, createTaskSchema, updateTaskSchema } from "../validators/task.schema.js";

const router: Router = Router();
router.use(verifyJwt);

/**
 * @openapi
 * /tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Create a task in a project belonging to the authenticated organization
 *     security: [{ bearerAuth: [] }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/TaskInput' } } } }
 *     responses:
 *       201: { description: Task created, content: { application/json: { schema: { $ref: '#/components/schemas/Success' } } } }
 *       400: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       401: { description: Not authenticated, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { description: Project unavailable in this organization, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *   get:
 *     tags: [Tasks]
 *     summary: List organization tasks with filters and offset pagination
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: status, schema: { type: string, enum: [todo, in_progress, review, done] } }
 *       - { in: query, name: priority, schema: { type: string, enum: [low, medium, high, urgent] } }
 *       - { in: query, name: assignee, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: dueDateFrom, schema: { type: string, format: date-time } }
 *       - { in: query, name: dueDateTo, schema: { type: string, format: date-time } }
 *       - { in: query, name: page, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *     responses:
 *       200: { description: Paginated task list, content: { application/json: { schema: { $ref: '#/components/schemas/Success' } } } }
 *       400: { description: Invalid filters, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       401: { description: Not authenticated, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.route("/")
    .post(validate(createTaskSchema), taskController.createTask)
    .get(taskController.getTasks);
/**
 * @openapi
 * /tasks/{id}/assign:
 *   post:
 *     tags: [Tasks]
 *     summary: Assign an organization member to a task and enqueue an email job
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer, minimum: 1 } }]
 *     requestBody: { required: true, content: { application/json: { schema: { type: object, required: [userId], properties: { userId: { type: integer, minimum: 1 } } } } } }
 *     responses:
 *       201: { description: Assignment and job ID created, content: { application/json: { schema: { $ref: '#/components/schemas/Success' } } } }
 *       400: { description: Assignee is not in the organization or invalid input, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       401: { description: Not authenticated, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { description: Task unavailable in this organization, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       409: { description: Assignment already exists, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.post("/:id/assign", validate(assignTaskSchema), taskController.assignUser);
/**
 * @openapi
 * /tasks/{id}/assign/{userId}:
 *   delete:
 *     tags: [Tasks]
 *     summary: Remove a user assignment from a task
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer, minimum: 1 } }
 *       - { in: path, name: userId, required: true, schema: { type: integer, minimum: 1 } }
 *     responses:
 *       200: { description: Assignment removed, content: { application/json: { schema: { $ref: '#/components/schemas/Success' } } } }
 *       401: { description: Not authenticated, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { description: Task or assignment unavailable in this organization, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.delete("/:id/assign/:userId", taskController.unassignUser);
/**
 * @openapi
 * /tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get a task in the authenticated organization
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer, minimum: 1 } }]
 *     responses:
 *       200: { description: Task, content: { application/json: { schema: { $ref: '#/components/schemas/Success' } } } }
 *       401: { description: Not authenticated, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { description: Task unavailable in this organization, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *   patch:
 *     tags: [Tasks]
 *     summary: Update a task in the authenticated organization
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer, minimum: 1 } }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/TaskUpdateInput' } } } }
 *     responses:
 *       200: { description: Task updated, content: { application/json: { schema: { $ref: '#/components/schemas/Success' } } } }
 *       400: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       401: { description: Not authenticated, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { description: Task or project unavailable in this organization, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete a task in the authenticated organization
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer, minimum: 1 } }]
 *     responses:
 *       200: { description: Task deleted, content: { application/json: { schema: { $ref: '#/components/schemas/Success' } } } }
 *       401: { description: Not authenticated, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { description: Task unavailable in this organization, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.route("/:id")
    .get(taskController.getTask)
    .patch(validate(updateTaskSchema), taskController.updateTask)
    .delete(taskController.deleteTask);

export default router;
