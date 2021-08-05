import * as EventController from "../controllers/EventController";
import * as express from "express";
import authMiddleware from "../auth.middleware";

const router = express.Router();

router.post("/:userId", authMiddleware, EventController.createEvent);
router.post("/:userId/all", authMiddleware, EventController.getEventsForUser);
router.get("/:eventId", authMiddleware, EventController.getEvent);
router.get("/next/:userId", authMiddleware, EventController.getMyNextEvents);
router.get("/past/:userId", authMiddleware, EventController.getMyPastEvents);
router.post("/:eventId/join/:userId", authMiddleware, EventController.joinEvent);
router.post("/:eventId/exit/:userId", authMiddleware, EventController.exitEvent);
router.post("/:eventId/chat/:userId", authMiddleware, EventController.sendMessage);
router.get("/:eventId/chat", authMiddleware, EventController.getMessages);

export default router;
