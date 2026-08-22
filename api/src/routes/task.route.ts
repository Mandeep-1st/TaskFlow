import { Router } from "express";
import * as taskController from "../controllers/task.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { assignTaskSchema, createTaskSchema, updateTaskSchema } from "../validators/task.schema.js";

const router: Router = Router();
router.use(verifyJwt);

router.route("/")
    .post(validate(createTaskSchema), taskController.createTask)
    .get(taskController.getTasks);
router.post("/:id/assign", validate(assignTaskSchema), taskController.assignUser);
router.delete("/:id/assign/:userId", taskController.unassignUser);
router.route("/:id")
    .get(taskController.getTask)
    .patch(validate(updateTaskSchema), taskController.updateTask)
    .delete(taskController.deleteTask);

export default router;
