import * as LocationController from "../controllers/LocationController";
import * as express from "express";
import authMiddleware from "../auth.middleware";
import { isAuthorized } from "../permission.middleware";

const router = express.Router();

router.get("/", authMiddleware, LocationController.getLocations);
router.get("/:userId", authMiddleware, isAuthorized(["owner"]), LocationController.getLocationsByUser);
router.get("/:locationId/fields", authMiddleware, LocationController.getFields);
router.get("/:locationId/fields/:fieldId/occupiedHours", authMiddleware, LocationController.getOcuppiedHours);
router.post("/:userId", authMiddleware, isAuthorized(["owner"]), LocationController.createLocation);
router.put("/:locationId", authMiddleware, isAuthorized(["owner"]), LocationController.editLocation);
router.post("/:locationId/fields", authMiddleware, isAuthorized(["owner"]), LocationController.addField);
// router.post("/join/:eventId", authMiddleware, EventController.joinEvent);
// router.post("/exit/:eventId", authMiddleware, EventController.exitEvent);
// router.post("/:eventId/chat", authMiddleware, EventController.sendMessage);
// router.get("/:eventId/chat", authMiddleware, EventController.getMessages);

export default router;
