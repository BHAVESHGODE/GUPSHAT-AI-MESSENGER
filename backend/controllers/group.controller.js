import mongoose from "mongoose";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketIds, io } from "../socket/socket.js";

// Controller to create a new Group Chat
export const createGroup = async (req, res) => {
  try {
    const { groupName, participantIds, groupPic } = req.body;
    const adminId = req.user._id;

    if (!groupName || !groupName.trim()) {
      return res.status(400).json({ error: "Group name is required" });
    }

    if (groupName.trim().length > 50) {
      return res.status(400).json({ error: "Group name must be 50 characters or fewer" });
    }

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length < 1) {
      return res.status(400).json({ error: "At least one additional contact is required for a group" });
    }

    // Validate all IDs are valid ObjectIds
    const validParticipantIds = participantIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validParticipantIds.length < 1) {
      return res.status(400).json({ error: "No valid participant IDs provided" });
    }

    // Ensure admin is included in participants
    const allParticipants = Array.from(new Set([adminId.toString(), ...validParticipantIds]));

    const defaultGroupPic = groupPic || `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(groupName)}`;

    const newGroup = await Conversation.create({
      isGroup: true,
      groupName: groupName.trim(),
      groupAdmin: adminId,
      groupPic: defaultGroupPic,
      participants: allParticipants,
      messages: [],
    });

    const populatedGroup = await Conversation.findById(newGroup._id)
      .populate("participants", "fullName username profilePic status bio")
      .populate("groupAdmin", "fullName username profilePic");

    // Notify all online participants via Socket.IO
    allParticipants.forEach((userId) => {
      const socketIds = getReceiverSocketIds(userId);
      socketIds.forEach((socketId) => {
        io.to(socketId).emit("newGroupCreated", populatedGroup);
      });
    });

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.log("Error in createGroup controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Controller to get all Group Conversations for authenticated user
export const getGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Conversation.find({
      isGroup: true,
      participants: userId,
    })
      .populate("participants", "fullName username profilePic status bio")
      .populate("groupAdmin", "fullName username profilePic")
      .sort({ updatedAt: -1 })
      .lean();

    // Attach latest-message preview per group (drives recent-on-top sorting)
    const tailIds = groups.map((g) => g.messages?.[g.messages.length - 1]).filter(Boolean);
    const tailDocs = tailIds.length
      ? await Message.find({ _id: { $in: tailIds } }).select("message fileType fileName createdAt senderId")
      : [];
    const tailById = new Map(tailDocs.map((m) => [String(m._id), m]));
    const withPreview = groups.map((g) => {
      const m = tailById.get(String(g.messages?.[g.messages.length - 1]));
      if (!m) return g;
      const sender = (g.participants || []).find((p) => String(p._id) === String(m.senderId));
      const who = sender && String(sender._id) !== String(userId) ? `${sender.fullName.split(" ")[0]}: ` : "";
      const text = m.message || (m.fileType === "image" ? "📷 Photo" : m.fileName || "📎 Attachment");
      return { ...g, lastMessage: `${who}${text}`, lastMessageAt: m.createdAt };
    });

    res.status(200).json(withPreview);
  } catch (error) {
    console.log("Error in getGroups controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Controller to add a member to a group (Admin only)
export const addGroupMember = async (req, res) => {
  try {
    const { groupId, userIdToAdd } = req.body;
    const adminId = req.user._id;

    const group = await Conversation.findById(groupId);
    if (!group || !group.isGroup) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (group.groupAdmin.toString() !== adminId.toString()) {
      return res.status(403).json({ error: "Only group admins can add members" });
    }

    if (group.participants.includes(userIdToAdd)) {
      return res.status(400).json({ error: "User is already in the group" });
    }

    group.participants.push(userIdToAdd);
    await group.save();

    const updatedGroup = await Conversation.findById(groupId)
      .populate("participants", "fullName username profilePic status bio")
      .populate("groupAdmin", "fullName username profilePic");

    // Notify all participants
    updatedGroup.participants.forEach((p) => {
      const socketIds = getReceiverSocketIds(p._id.toString());
      socketIds.forEach((socketId) => {
        io.to(socketId).emit("groupUpdated", updatedGroup);
      });
    });

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.log("Error in addGroupMember controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Controller to remove a member or leave group
export const removeGroupMember = async (req, res) => {
  try {
    const { groupId, userIdToRemove } = req.body;
    const currentUserId = req.user._id;

    const group = await Conversation.findById(groupId);
    if (!group || !group.isGroup) {
      return res.status(404).json({ error: "Group not found" });
    }

    const isAdmin = group.groupAdmin.toString() === currentUserId.toString();
    const isSelfRemove = currentUserId.toString() === userIdToRemove;

    if (!isAdmin && !isSelfRemove) {
      return res.status(403).json({ error: "Only admins can remove members" });
    }

    group.participants = group.participants.filter(
      (id) => id.toString() !== userIdToRemove.toString()
    );

    // If admin leaves, reassign admin to next remaining participant
    if (group.groupAdmin.toString() === userIdToRemove.toString() && group.participants.length > 0) {
      group.groupAdmin = group.participants[0];
    }

    await group.save();

    const updatedGroup = await Conversation.findById(groupId)
      .populate("participants", "fullName username profilePic status bio")
      .populate("groupAdmin", "fullName username profilePic");

    // Broadcast update
    const allSocketsToNotify = [
      ...group.participants.flatMap((p) => getReceiverSocketIds(p.toString())),
      ...getReceiverSocketIds(userIdToRemove),
    ];

    allSocketsToNotify.forEach((socketId) => {
      io.to(socketId).emit("groupUpdated", updatedGroup);
    });

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.log("Error in removeGroupMember controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
