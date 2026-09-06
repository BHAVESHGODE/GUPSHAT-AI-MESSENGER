import express from "express";
import {
  createGroup,
  getGroups,
  addGroupMember,
  removeGroupMember,
} from "../controllers/group.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/create", protectRoute, createGroup);
router.get("/", protectRoute, getGroups);
router.put("/add-member", protectRoute, addGroupMember);
router.put("/remove-member", protectRoute, removeGroupMember);

export default router;
