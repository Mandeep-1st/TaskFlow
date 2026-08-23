import { Router } from "express";
import { getAllDeletedJobs, getJobs, getJobStatus } from "../controllers/job.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router: Router = Router();
router.get("/dead-letters", verifyJwt, getAllDeletedJobs)
router.get("/:id", verifyJwt, getJobStatus);
router.get("/", verifyJwt, getJobs)
export default router;
