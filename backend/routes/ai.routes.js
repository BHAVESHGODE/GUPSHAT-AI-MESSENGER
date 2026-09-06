import express from "express";
import {
  chatWithAI,
  generateSmartReplies,
  translateMessage,
  getCharacters,
  submitAIFeedback,
  getAIFeedbackStats,
  exportAIFeedbackDataset,
} from "../controllers/ai.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/characters", protectRoute, getCharacters);
router.post("/chat", protectRoute, chatWithAI);
router.post("/smart-replies", protectRoute, generateSmartReplies);
router.post("/translate", protectRoute, translateMessage);

// Automated RLHF Feedback Loop endpoints (Phase 1)
router.post("/feedback", protectRoute, submitAIFeedback);
router.get("/feedback/stats", protectRoute, getAIFeedbackStats);
router.get("/feedback/export", protectRoute, exportAIFeedbackDataset);

export default router;
