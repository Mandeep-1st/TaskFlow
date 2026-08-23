
import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { addMemberSchema, registerSchema, loginSchema } from "../validators/auth.schema.js";
import { authRateLimiter } from "../middleware/ratelimiter.middleware.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router: Router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a user and create their organization
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, organizationName]
 *             properties:
 *               name: { type: string, minLength: 1 }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               organizationName: { type: string, minLength: 1 }
 *     responses:
 *       201: { description: User and organization created, content: { application/json: { schema: { $ref: '#/components/schemas/Success' } } } }
 *       400: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       409: { description: Email already exists, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.post("/register", authRateLimiter, validate(registerSchema), authController.register);
/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Log in and set a refresh-token cookie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               orgId: { type: integer, description: Required for users in multiple organizations }
 *     responses:
 *       200: { description: Access token and session details, content: { application/json: { schema: { $ref: '#/components/schemas/Success' } } } }
 *       400: { description: Invalid organization selection, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       401: { description: Invalid credentials, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.post("/login", authRateLimiter, validate(loginSchema), authController.login);
/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Get a new access token using the refresh-token cookie
 *     responses:
 *       200: { description: Access token refreshed, content: { application/json: { schema: { $ref: '#/components/schemas/Success' } } } }
 *       401: { description: Missing, invalid, or expired refresh token, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.post("/refresh", authRateLimiter, authController.refresh); // reads cookie, no body validation needed
/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Revoke the current refresh-token session
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Logged out, content: { application/json: { schema: { $ref: '#/components/schemas/Success' } } } }
 *       401: { description: Authentication or refresh token failed, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.post("/logout", authRateLimiter, verifyJwt, authController.logout); // needs to know WHO is logging out
/**
 * @openapi
 * /auth/members:
 *   post:
 *     tags: [Authentication]
 *     summary: Add a new or existing user to the caller's organization
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, minLength: 1 }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               role: { type: string, enum: [org_admin, member], default: member }
 *     responses:
 *       201: { description: Membership created, content: { application/json: { schema: { $ref: '#/components/schemas/Success' } } } }
 *       401: { description: Not authenticated, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       403: { description: Admin role required, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       409: { description: Membership already exists, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.post("/members", verifyJwt, requireRole("org_admin"), validate(addMemberSchema), authController.addMember);

export default router;
