import * as UserController from "../controllers/UserController";
import * as express from "express";
import authMiddleware from "../auth.middleware";

const router = express.Router();

router.get("/:id", authMiddleware, UserController.getProfile);
router.get("/", authMiddleware, UserController.getProfileByEmail);
router.put("/:id", authMiddleware, UserController.updateUser);
router.post("/upload/:id", authMiddleware, UserController.uploadImage);

export default router;
