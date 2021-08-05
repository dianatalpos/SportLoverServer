import * as express from "express";

import UserRoute from "./UserRoute";
import EventRoute from "./EventRoutes";
import FriendshipRoute from "./FriendshipRoute";
import LocationRoute from "./LocationRoute";
import ProfileRoute from "./ProfileRoute";


const router = express.Router();

router.use("/", UserRoute);
router.use("/events", EventRoute);
router.use("/friendship", FriendshipRoute);
router.use("/locations", LocationRoute);
router.use("/profiles", ProfileRoute);

export default router;

