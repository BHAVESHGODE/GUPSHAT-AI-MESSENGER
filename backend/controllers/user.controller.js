import mongoose from "mongoose";
import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { AI_CHARACTERS, AI_VIRTUAL_IDS } from "../config/aiCharacters.js";

const sanitize = (str) => str.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]));

const previewOf = (m) =>
  m.message ||
  (m.fileType === "image" ? "📷 Photo" : m.fileType === "video" ? "🎬 Video" : m.fileType === "audio" ? "🎤 Voice note" : m.fileName || "📎 Attachment");

// Controller to get all users except logged-in user (with virtual AI characters prepended)
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password -resetPasswordToken -resetPasswordExpires").lean();

    // Latest activity per 1-on-1 conversation (drives recent-on-top sorting)
    const convos = await Conversation.find({
      isGroup: { $ne: true },
      participants: loggedInUserId,
    }).select("participants messages");
    const tailIds = convos.map((c) => c.messages?.[c.messages.length - 1]).filter(Boolean);
    const tailDocs = tailIds.length
      ? await Message.find({ _id: { $in: tailIds } }).select("message fileType fileName createdAt")
      : [];
    const tailById = new Map(tailDocs.map((m) => [String(m._id), m]));
    const activity = new Map();
    convos.forEach((c) => {
      const m = tailById.get(String(c.messages?.[c.messages.length - 1]));
      if (!m) return;
      const other = c.participants.map(String).find((p) => p !== String(loggedInUserId));
      if (other) activity.set(other, { lastMessage: previewOf(m), lastMessageAt: m.createdAt });
    });
    const attach = (u) => ({ ...u, ...(activity.get(String(u._id)) || {}) });

    // Map AI Characters to virtual 1-on-1 sidebar users with deterministic 24-hex ObjectIds
    const aiUsers = Object.values(AI_CHARACTERS).map((char) => ({
      _id: AI_VIRTUAL_IDS[char.id] || "650000000000000000000001",
      fullName: `${char.name} (AI)`,
      username: `ai_${char.id}`,
      profilePic: char.avatar,
      isAI: true,
      isIndividualAI: true,
      characterId: char.id,
      tagline: char.tagline,
      bio: char.tagline,
      status: "Active",
    }));

    res.status(200).json([...aiUsers.map(attach), ...filteredUsers.map(attach)]);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Controller to update the authenticated user's profile info
export const updateUserProfile = async (req, res) => {
  try {
    const { fullName, bio, status, profilePic } = req.body;
    const userId = req.user._id;

    const updates = {};
    if (fullName) {
      if (fullName.trim().length < 2 || fullName.trim().length > 100) {
        return res.status(400).json({ error: "Name must be 2-100 characters long" });
      }
      updates.fullName = sanitize(fullName.trim());
    }
    if (bio !== undefined) {
      if (typeof bio !== "string") {
        return res.status(400).json({ error: "Bio must be a string" });
      }
      updates.bio = sanitize(bio.trim().slice(0, 200));
    }
    if (status) {
      if (!["Active", "Away", "Do Not Disturb"].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
      updates.status = status;
    }
    if (profilePic !== undefined) {
      if (profilePic === "") {
        updates.profilePic = "";
      } else if (typeof profilePic === "string") {
        const isDataUri = profilePic.startsWith("data:image/");
        const isRelative = profilePic.startsWith("/") || profilePic.startsWith("./");
        if (isDataUri || isRelative) {
          updates.profilePic = profilePic;
        } else {
          try {
            const url = new URL(profilePic);
            if (["https:", "http:", "data:"].includes(url.protocol)) {
              updates.profilePic = profilePic;
            } else {
              return res.status(400).json({ error: "Invalid profile picture format" });
            }
          } catch {
            return res.status(400).json({ error: "Invalid profile picture format" });
          }
        }
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    ).select("-password -resetPasswordToken -resetPasswordExpires");

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error in updateUserProfile: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Controller to Block or Unblock a user
export const toggleBlockUser = async (req, res) => {
  try {
    const { id: targetUserId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const isBlocked = user.blockedUsers.some(
      (bId) => bId.toString() === targetUserId.toString()
    );

    if (isBlocked) {
      user.blockedUsers = user.blockedUsers.filter(
        (bId) => bId.toString() !== targetUserId.toString()
      );
    } else {
      user.blockedUsers.push(targetUserId);
    }

    await user.save();

    res.status(200).json({
      blockedUsers: user.blockedUsers,
      isBlocked: !isBlocked,
      message: !isBlocked ? "User blocked" : "User unblocked",
    });
  } catch (error) {
    console.error("Error in toggleBlockUser: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
