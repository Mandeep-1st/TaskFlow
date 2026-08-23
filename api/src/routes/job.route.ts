import { Router } from "express";
import { getAllDeletedJobs, getJobs, getJobStatus } from "../controllers/job.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router: Router = Router();
/**
 * @openapi
 * /jobs/dead-letters:
 *   get:
 *     tags: [Jobs]
 *     summary: List dead-letter email jobs
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Dead-letter jobs, content: { application/json: { schema: { $ref: '#/components/schemas/Success' } } } }
 *       401: { description: Not authenticated, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.get("/dead-letters", verifyJwt, getAllDeletedJobs)
/**
 * @openapi
 * /jobs/{id}:
 *   get:
 *     tags: [Jobs]
 *     summary: Get email-job status by BullMQ job ID
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Job status and metadata, content: { application/json: { schema: { $ref: '#/components/schemas/Success' } } } }
 *       401: { description: Not authenticated, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { description: Job not found, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.get("/:id", verifyJwt, getJobStatus);
/**
 * @openapi
 * /jobs:
 *   get:
 *     tags: [Jobs]
 *     summary: List email jobs across queue states
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Job list, content: { application/json: { schema: { $ref: '#/components/schemas/Success' } } } }
 *       401: { description: Not authenticated, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.get("/", verifyJwt, getJobs)
export default router;
