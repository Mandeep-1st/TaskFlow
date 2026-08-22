import { Router } from "express";
import * as projectController from "../controllers/project.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createProjectSchema, updateProjectSchema } from "../validators/project.schema.js";

const router: Router = Router();
router.use(verifyJwt);

router.route("/")
    .post(validate(createProjectSchema), projectController.createProject)
    .get(projectController.getProjects);
router.get("/:id/dashboard", projectController.getProjectDashboard);
router.route("/:id")
    .get(projectController.getProject)
    .patch(validate(updateProjectSchema), projectController.updateProject)
    .delete(requireRole("org_admin"), projectController.deleteProject);

export default router;
