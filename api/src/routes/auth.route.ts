
import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { addMemberSchema, registerSchema, loginSchema } from "../validators/auth.schema.js";
import { authRateLimiter } from "../middleware/ratelimiter.middleware.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router: Router = Router();

router.post("/register", authRateLimiter, validate(registerSchema), authController.register);
router.post("/login", authRateLimiter, validate(loginSchema), authController.login);
router.post("/refresh", authRateLimiter, authController.refresh); // reads cookie, no body validation needed
router.post("/logout", authRateLimiter, verifyJwt, authController.logout); // needs to know WHO is logging out
router.post("/members", verifyJwt, requireRole("org_admin"), validate(addMemberSchema), authController.addMember);

export default router;
