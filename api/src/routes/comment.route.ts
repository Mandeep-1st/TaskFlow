import { Router } from "express";
import * as commentController from "../controllers/comment.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createCommentSchema } from "../validators/comment.schema.js";

const router: Router = Router();
router.use(verifyJwt);
router.route("/:taskId/comments")
    .post(validate(createCommentSchema), commentController.createComment)
    .get(commentController.getComments);
router.delete("/comments/:commentId", commentController.deleteComment);

export default router;
