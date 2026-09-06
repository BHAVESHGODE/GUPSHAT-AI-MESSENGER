import mongoose from "mongoose";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import CallLog from "../models/callLog.model.js";
import { getReceiverSocketIds, io } from "../socket/socket.js";
import { AI_CHARACTERS, AI_ID_TO_CHARACTER_MAP, AI_VIRTUAL_IDS } from "../config/aiCharacters.js";
import { clearAISession, generateWaterfallAIResponse } from "./ai.controller.js";
import { sanitizeFileName } from "../middleware/upload.js";

const sanitizeText = (str) => {
  if (!str || typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "").trim();
};

// Controller to send a message (Direct, Group, Stateless AI Bot, or Stateful 1-on-1 AI)
export const sendMessage = async (req, res) => {
  try {
    const { message, fileUrl, fileType, fileName, fileSize, replyTo } = req.body;
    const { id: targetId } = req.params;
    const senderId = req.user._id;

    const cleanedMessage = typeof message === "string" ? message.trim() : "";

    if (cleanedMessage.length > 4000) {
      return res.status(400).json({ error: "Message too long (max 4000 characters)" });
    }

    // Special handling for Stateless Group AI Bot
    if (targetId === "guppshup_ai_bot") {
      const dummyMsg = {
        _id: "user_msg_" + Date.now(),
        senderId: req.user,
        receiverId: targetId,
        message: message || "",
        fileUrl: fileUrl || "",
        fileType: fileType || "",
        fileName: fileName || "",
        fileSize: fileSize || 0,
        replyTo: replyTo || null,
        createdAt: new Date().toISOString(),
      };
      return res.status(201).json(dummyMsg);
    }

    // =========================================================================
    // STATEFUL 1-ON-1 AI CHARACTER MEMORY PIPELINE (MongoDB Persistent)
    // =========================================================================
    const aiCharKey = AI_ID_TO_CHARACTER_MAP[targetId];
    if (aiCharKey && AI_CHARACTERS[aiCharKey]) {
      const character = AI_CHARACTERS[aiCharKey];

      // 1. Save User Message to MongoDB
      const userMessage = new Message({
        senderId,
        receiverId: targetId,
        message: message || "",
        fileUrl: fileUrl || "",
        fileType: fileType || "",
        fileName: fileName || "",
        fileSize: fileSize || 0,
        replyTo: replyTo || null,
      });

      let conversation = await Conversation.findOne({
        isGroup: false,
        participants: { $all: [senderId, targetId] },
      });

      if (!conversation) {
        conversation = await Conversation.create({
          isGroup: false,
          participants: [senderId, targetId],
        });
      }

      conversation.messages.push(userMessage._id);
      await Promise.all([conversation.save(), userMessage.save()]);

      // 2. Fetch History from MongoDB for LLM Context (Last 15 Messages)
      const allPastMessages = await Message.find({
        _id: { $in: conversation.messages },
      }).sort({ createdAt: 1 });

      const pastMessagesDocs = allPastMessages.slice(-15);
      const systemPromptContent = `${character.systemInstruction}\n\n${character.fewShotExamples || ""}`;

      const sessionHistory = pastMessagesDocs.map((m) => ({
        role: String(m.senderId) === String(targetId) ? "assistant" : "user",
        content: (m.message || "").trim(),
      }));

      // 3. Execute Waterfall LLM Inference (OpenRouter Primary -> Gemini Fallback)
      let messageBubbles = await generateWaterfallAIResponse(character, systemPromptContent, sessionHistory);


      // Dynamic Fallback if API fails
      if (!messageBubbles || messageBubbles.length === 0) {
        if (aiCharKey === "kabir") {
          messageBubbles = ["I hear you brother.", "Tell me more about what's on your mind."];
        } else if (aiCharKey === "tara") {
          messageBubbles = ["Mmm, interesting...", "Tell me more."];
        } else if (aiCharKey === "sid") {
          messageBubbles = ["Oh, you're still alive. Tragic.", "What do you want? 💀"];
        } else if (aiCharKey === "maverick") {
          messageBubbles = ["Well, well... missed me already?"];
        } else if (aiCharKey === "ghalib") {
          messageBubbles = ["Aaiye, baithiye. Kahiye, kya chal raha hai zehan mein?"];
        } else if (aiCharKey === "pippaa") {
          messageBubbles = ["omg finally. i was dying of boredom.", "tell me everything, what's the gossip today??"];
        } else {
          messageBubbles = ["I get what you mean.", "Let's talk more."];
        }
      }

      // 4. Save AI Response to MongoDB
      const aiReplyText = messageBubbles.join("\n");
      const aiMessage = new Message({
        senderId: targetId,
        receiverId: senderId,
        message: aiReplyText,
      });

      conversation.messages.push(aiMessage._id);
      await Promise.all([conversation.save(), aiMessage.save()]);

      // 5. Populate & Emit via Socket.IO
      const populatedAiMsg = {
        _id: aiMessage._id,
        senderId: {
          _id: targetId,
          fullName: `${character.name} (AI)`,
          username: `ai_${character.id}`,
          profilePic: character.avatar,
        },
        receiverId: senderId,
        message: aiReplyText,
        createdAt: aiMessage.createdAt,
      };

      const receiverSocketIds = getReceiverSocketIds(senderId.toString());
      receiverSocketIds.forEach((socketId) => {
        io.to(socketId).emit("newMessage", populatedAiMsg);
      });

      return res.status(201).json(populatedAiMsg);
    }

    // Default Human / Group Message Flow
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ error: "Invalid target ID" });
    }

    let conversation = await Conversation.findOne({ _id: targetId, isGroup: true, participants: senderId });
    let isGroupChat = false;

    if (conversation) {
      isGroupChat = true;
    } else {
      conversation = await Conversation.findOne({
        isGroup: false,
        participants: { $all: [senderId, targetId] },
      });

      if (!conversation) {
        conversation = await Conversation.create({
          isGroup: false,
          participants: [senderId, targetId],
        });
      }
    }

    const newMessage = new Message({
      senderId,
      receiverId: targetId,
      message: message || "",
      fileUrl: fileUrl || "",
      fileType: fileType || "",
      fileName: fileName || "",
      fileSize: fileSize || 0,
      replyTo: replyTo || null,
    });

    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }

    await Promise.all([conversation.save(), newMessage.save()]);

    let populatedMessage = await Message.findById(newMessage._id)
      .populate("senderId", "fullName username profilePic")
      .populate({
        path: "replyTo",
        select: "message senderId fileType fileUrl fileName",
      });

    if (isGroupChat) {
      conversation.participants.forEach((participantId) => {
        const socketIds = getReceiverSocketIds(participantId.toString());
        socketIds.forEach((socketId) => {
          io.to(socketId).emit("newMessage", populatedMessage);
        });
      });
    } else {
      const receiverSocketIds = getReceiverSocketIds(targetId);
      receiverSocketIds.forEach((socketId) => {
        io.to(socketId).emit("newMessage", populatedMessage);
      });
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Controller to get all messages (Direct, Group, or 1-on-1 AI)
export const getMessages = async (req, res) => {
  try {
    const { id: targetId } = req.params;
    const senderId = req.user._id;

    if (targetId === "guppshup_ai_bot") {
      return res.status(200).json([]);
    }

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(200).json([]);
    }

    let conversation = await Conversation.findOne({ _id: targetId, isGroup: true, participants: senderId }).populate({
      path: "messages",
      populate: [
        { path: "senderId", select: "fullName username profilePic" },
        { path: "replyTo", select: "message senderId fileType fileUrl fileName" },
      ],
    });

    if (!conversation) {
      conversation = await Conversation.findOne({
        isGroup: false,
        participants: { $all: [senderId, targetId] },
      }).populate({
        path: "messages",
        populate: [
          { path: "senderId", select: "fullName username profilePic" },
          { path: "replyTo", select: "message senderId fileType fileUrl fileName" },
        ],
      });
    }

    if (!conversation) return res.status(200).json([]);

    if (!conversation.isGroup) {
      await Message.updateMany(
        { senderId: targetId, receiverId: senderId, isRead: false },
        { $set: { isRead: true } }
      );
    }

    // Map AI virtual sender ObjectIds cleanly for 1-on-1 chats
    const aiCharKey = AI_ID_TO_CHARACTER_MAP[targetId];
    const aiCharacter = aiCharKey ? AI_CHARACTERS[aiCharKey] : null;

    const messages = conversation.messages.map((msg) => {
      const msgObj = msg.toObject ? msg.toObject() : { ...msg };
      const msgSenderId = msgObj.senderId?._id ? msgObj.senderId._id.toString() : msgObj.senderId?.toString();

      if (msgSenderId === targetId.toString()) {
        if (!msgObj.senderId || typeof msgObj.senderId === "string" || !msgObj.senderId.fullName) {
          if (aiCharacter) {
            msgObj.senderId = {
              _id: targetId,
              fullName: `${aiCharacter.name} (AI)`,
              username: `ai_${aiCharacter.id}`,
              profilePic: aiCharacter.avatar,
            };
          }
        }
      }
      return msgObj;
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { Readable } = await import("stream");
    const { getCloudinary } = await import("../config/cloudinary.js");
    const cloudinary = getCloudinary();

    const mimeType = req.file.mimetype;
    let fileType = "document";
    let folder = "gupshup/documents";
    if (mimeType.startsWith("image/")) { fileType = "image"; folder = "gupshup/images"; }
    else if (mimeType.startsWith("video/")) { fileType = "video"; folder = "gupshup/videos"; }
    else if (mimeType.startsWith("audio/")) { fileType = "audio"; folder = "gupshup/audio"; }

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: fileType === "video" ? "video" : "auto" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      Readable.from(req.file.buffer).pipe(uploadStream);
    });

    res.status(200).json({
      fileUrl: uploadResult.secure_url,
      fileName: sanitizeFileName(req.file.originalname),
      fileSize: req.file.size,
      fileType,
    });
  } catch (error) {
    console.error("Error in uploadFile controller: ", error.message, error.stack);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const reactToMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: "Invalid message ID" });
    }

    if (!emoji || typeof emoji !== "string" || emoji.length > 8) {
      return res.status(400).json({ error: "Invalid emoji" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Verify user is a participant in the conversation
    const isParticipant = await Conversation.findOne({
      messages: message._id,
      participants: userId,
    });
    if (!isParticipant) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.userId.toString() === userId.toString()
    );

    if (existingReactionIndex > -1) {
      if (message.reactions[existingReactionIndex].emoji === emoji) {
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        message.reactions[existingReactionIndex].emoji = emoji;
      }
    } else {
      message.reactions.push({ userId, emoji });
    }

    await message.save();

    const targetSocketIds = [
      ...getReceiverSocketIds(message.receiverId.toString()),
      ...getReceiverSocketIds(message.senderId.toString()),
    ];

    targetSocketIds.forEach((socketId) => {
      io.to(socketId).emit("messageReactionUpdated", {
        messageId: message._id,
        reactions: message.reactions,
      });
    });

    res.status(200).json(message.reactions);
  } catch (error) {
    console.log("Error in reactToMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { message: newText } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ error: "Invalid message ID" });
    }

    if (!newText || typeof newText !== "string" || newText.trim().length === 0) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }
    if (newText.length > 4000) {
      return res.status(400).json({ error: "Message too long (max 4000 characters)" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized to edit this message" });
    }

    message.message = newText.trim();
    message.isEdited = true;
    await message.save();

    const populatedMessage = await Message.findById(messageId)
      .populate("senderId", "fullName username profilePic")
      .populate({
        path: "replyTo",
        select: "message senderId fileType fileUrl fileName",
      });

    const targetSocketIds = [
      ...getReceiverSocketIds(message.receiverId.toString()),
      ...getReceiverSocketIds(message.senderId.toString()),
    ];

    targetSocketIds.forEach((socketId) => {
      io.to(socketId).emit("messageEdited", populatedMessage);
    });

    res.status(200).json(populatedMessage);
  } catch (error) {
    console.log("Error in editMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const clearAIChatHistory = async (req, res) => {
  try {
    const { characterId } = req.params;
    const userId = req.user._id;

    // Map persona key (kabir/tara/...) to its deterministic virtual ObjectId.
    // Falls back to the raw id so direct ObjectId wipes also work.
    const virtualId = AI_VIRTUAL_IDS[characterId] || characterId;

    // Stateless Group AI sandbox keeps no server history — nothing to delete.
    if (characterId === "guppshup_ai_bot") {
      return res.status(200).json({ message: "Memory wiped successfully" });
    }

    const conversations = await Conversation.find({
      isGroup: { $ne: true },
      participants: { $all: [userId, virtualId] },
    });

    const messageIds = conversations.flatMap((c) => c.messages || []);
    if (messageIds.length > 0) {
      await Message.deleteMany({ _id: { $in: messageIds } });
    }
    // Safety net for any stray cross-addressed docs outside the conversation refs.
    await Message.deleteMany({
      $or: [
        { senderId: userId, receiverId: virtualId },
        { senderId: virtualId, receiverId: userId },
      ],
    });

    await Conversation.updateMany(
      { _id: { $in: conversations.map((c) => c._id) } },
      { $set: { messages: [] } }
    );

    // Also drop the in-memory sandbox session so the AI truly forgets.
    const personaKey = AI_CHARACTERS[characterId]
      ? characterId
      : AI_ID_TO_CHARACTER_MAP[characterId] || AI_ID_TO_CHARACTER_MAP[virtualId] || characterId;
    clearAISession(String(userId), personaKey);

    res.status(200).json({ message: "Memory wiped successfully" });
  } catch (error) {
    console.log("Error in clearAIChatHistory controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized to delete this message" });
    }

    message.isDeleted = true;
    message.message = "This message was deleted";
    message.fileUrl = "";
    message.fileType = "";
    message.fileName = "";
    await message.save();

    const targetSocketIds = [
      ...getReceiverSocketIds(message.receiverId.toString()),
      ...getReceiverSocketIds(message.senderId.toString()),
    ];

    targetSocketIds.forEach((socketId) => {
      io.to(socketId).emit("messageDeleted", { messageId: message._id });
    });

    res.status(200).json({ messageId: message._id, message: "Message deleted" });
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Log a call event (audio/video) with status and duration
export const logCall = async (req, res) => {
  try {
    const { userId } = req.params;
    const callerId = req.user._id;
    const { callType, status, duration = 0 } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const validCallTypes = ["audio", "video"];
    const validStatuses = ["completed", "missed", "declined", "ended"];
    if (!callType || !status || !validCallTypes.includes(callType) || !validStatuses.includes(status)) {
      return res.status(400).json({ error: "callType (audio/video) and status (completed/missed/declined/ended) are required" });
    }

    if (typeof duration !== "number" || duration < 0 || duration > 86400) {
      return res.status(400).json({ error: "Invalid duration" });
    }

    const log = new CallLog({
      callerId,
      receiverId: userId,
      callType,
      status,
      duration,
    });

    await log.save();
    res.status(201).json({ message: "Call logged successfully", callLog: log });
  } catch (error) {
    console.log("Error in logCall controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get call log for a specific user
export const getCallLog = async (req, res) => {
  try {
    const { userId } = req.params;
    const callerId = req.user._id;

    const logs = await CallLog.find({
      $or: [
        { callerId, receiverId: userId },
        { callerId: userId, receiverId: callerId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json(logs);
  } catch (error) {
    console.log("Error in getCallLog controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};