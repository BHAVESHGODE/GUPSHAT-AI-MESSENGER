// Import Express, controllers, and middleware
import express from "express";
import {
  getMessages,
  sendMessage,
  uploadFile,
  reactToMessage,
  editMessage,
  deleteMessage,
  clearAIChatHistory,
  logCall,
  getCallLog,
} from "../controllers/message.controller.js";
import protectRoute from "../middleware/protectRoute.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// Route to get all messages with a specific user (protected)
router.get("/:id", protectRoute, getMessages);

// Route to send a message to a specific user (protected)
router.post("/send/:id", protectRoute, sendMessage);

// Route to upload a file (protected)
router.post("/upload", protectRoute, upload.single("file"), uploadFile);

// Route to react to a message (protected)
router.post("/react/:id", protectRoute, reactToMessage);

// Route to edit a message (protected)
router.put("/edit/:id", protectRoute, editMessage);

// Route to wipe AI chat history with a character (protected)
router.delete("/clear/:characterId", protectRoute, clearAIChatHistory);

// Route to log a call event (protected)
router.post("/call/:userId", protectRoute, logCall);

// Route to get call log for a user (protected)
router.get("/calls/:userId", protectRoute, getCallLog);

// Route to delete a message (protected)
router.delete("/:id", protectRoute, deleteMessage);

// Export the router for use in server setup
export default router;
