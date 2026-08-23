import { Router } from "express";
import { getJobStatus } from "../controllers/job.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router: Router = Router();
router.get("/:id", verifyJwt, getJobStatus);

export default router;
