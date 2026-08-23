import { Router } from "express";
import * as projectController from "../controllers/project.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createProjectSchema, updateProjectSchema } from "../validators/project.schema.js";

const router: Router = Router();
router.use(verifyJwt);

/**
 * @openapi
 * /projects:
 *   post:
 *     tags: [Projects]
 *     summary: Create a project in the authenticated organization
 *     security: [{ bearerAuth: [] }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/ProjectInput' } } } }
 *     responses:
 *       201: { description: Project created, content: { application/json: { schema: { $ref: '#/components/schemas/Success' } } } }
 *       400: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       401: { description: Not authenticated, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *   get:
 *     tags: [Projects]
 *     summary: List projects in the authenticated organization
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Project list, content: { application/json: { schema: { $ref: '#/components/schemas/Success' } } } }
 *       401: { description: Not authenticated, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.route("/")
    .post(validate(createProjectSchema), projectController.createProject)
    .get(projectController.getProjects);
/**
 * @openapi
 * /projects/{id}/dashboard:
 *   get:
 *     tags: [Projects]
 *     summary: Get task counts grouped by status for a project
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer, minimum: 1 } }]
 *     responses:
 *       200: { description: Dashboard counts, content: { application/json: { schema: { $ref: '#/components/schemas/Success' } } } }
 *       401: { description: Not authenticated, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { description: Project unavailable in this organization, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.get("/:id/dashboard", projectController.getProjectDashboard);
/**
 * @openapi
 * /projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Get a project in the authenticated organization
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer, minimum: 1 } }]
 *     responses:
 *       200: { description: Project, content: { application/json: { schema: { $ref: '#/components/schemas/Success' } } } }
 *       401: { description: Not authenticated, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { description: Project unavailable in this organization, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *   patch:
 *     tags: [Projects]
 *     summary: Update a project in the authenticated organization
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer, minimum: 1 } }]
 *     requestBody: { required: true, content: { application/json: { schema: { $ref: '#/components/schemas/ProjectUpdateInput' } } } }
 *     responses:
 *       200: { description: Project updated, content: { application/json: { schema: { $ref: '#/components/schemas/Success' } } } }
 *       400: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       401: { description: Not authenticated, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { description: Project unavailable in this organization, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *   delete:
 *     tags: [Projects]
 *     summary: Delete a project (organization admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer, minimum: 1 } }]
 *     responses:
 *       200: { description: Project deleted, content: { application/json: { schema: { $ref: '#/components/schemas/Success' } } } }
 *       401: { description: Not authenticated, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       403: { description: Admin role required, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { description: Project unavailable in this organization, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.route("/:id")
    .get(projectController.getProject)
    .patch(validate(updateProjectSchema), projectController.updateProject)
    .delete(requireRole("org_admin"), projectController.deleteProject);

export default router;
