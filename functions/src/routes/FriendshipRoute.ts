import * as FriendshipController from "../controllers/FriendshipController";
import * as express from "express";
import authMiddleware from "../auth.middleware";

const router = express.Router();

router.post("/:userId", authMiddleware, FriendshipController.sendFriendRequest);
router.post("/:userId/accept", authMiddleware, FriendshipController.acceptFriendRequest);
router.post("/:userId/decline", authMiddleware, FriendshipController.declineFriendRequest);
router.get("/:userId", authMiddleware, FriendshipController.getFriends);
router.get("/requests/:userId", authMiddleware, FriendshipController.getFriendsRequests);

export default router;
