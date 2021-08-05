import * as UserController from "../controllers/UserController";
import * as express from "express";

const router = express.Router();

router.post("/register", UserController.register);
router.post("/login", UserController.login);

export default router;
