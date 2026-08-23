import { Router } from "express";
import * as commentController from "../controllers/comment.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createCommentSchema } from "../validators/comment.schema.js";

const router: Router = Router();
router.use(verifyJwt);
/**
 * @openapi
 * /tasks/{taskId}/comments:
 *   post:
 *     tags: [Comments]
 *     summary: Create a comment as the authenticated user
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: taskId, required: true, schema: { type: integer, minimum: 1 } }]
 *     requestBody: { required: true, content: { application/json: { schema: { type: object, required: [content], properties: { content: { type: string, minLength: 1, maxLength: 2000 } } } } } }
 *     responses:
 *       201: { description: Comment created, content: { application/json: { schema: { $ref: '#/components/schemas/Success' } } } }
 *       400: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       401: { description: Not authenticated, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { description: Task unavailable in this organization, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *   get:
 *     tags: [Comments]
 *     summary: List comments for a task
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: taskId, required: true, schema: { type: integer, minimum: 1 } }]
 *     responses:
 *       200: { description: Comment list, content: { application/json: { schema: { $ref: '#/components/schemas/Success' } } } }
 *       401: { description: Not authenticated, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { description: Task unavailable in this organization, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.route("/:taskId/comments")
    .post(validate(createCommentSchema), commentController.createComment)
    .get(commentController.getComments);
/**
 * @openapi
 * /tasks/comments/{commentId}:
 *   delete:
 *     tags: [Comments]
 *     summary: Delete a comment (author or organization admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: commentId, required: true, schema: { type: integer, minimum: 1 } }]
 *     responses:
 *       200: { description: Comment deleted, content: { application/json: { schema: { $ref: '#/components/schemas/Success' } } } }
 *       401: { description: Not authenticated, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       403: { description: Not comment author or organization admin, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { description: Comment unavailable in this organization, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.delete("/comments/:commentId", commentController.deleteComment);

export default router;
