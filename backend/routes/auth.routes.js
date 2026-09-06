import express from "express";
const router = express.Router();

import { login, logout, signup, forgotPassword, resetPassword } from "../controllers/auth.controller.js";

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
