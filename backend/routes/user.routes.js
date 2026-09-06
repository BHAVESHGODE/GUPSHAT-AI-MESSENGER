import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { getUsersForSidebar, updateUserProfile, toggleBlockUser } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/", protectRoute, getUsersForSidebar);
router.put("/profile", protectRoute, updateUserProfile);
router.put("/block/:id", protectRoute, toggleBlockUser);

export default router;
