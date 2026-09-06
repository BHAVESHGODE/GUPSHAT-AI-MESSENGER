import { Server } from "socket.io";
import http from "http";
import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

// Parse the raw Cookie header from WebSocket handshake
const parseCookies = (header) =>
  Object.fromEntries(
    (header || "")
      .split(";")
      .map((c) => {
        const i = c.indexOf("=");
        return i < 0 ? [] : [c.slice(0, i).trim(), decodeURIComponent(c.slice(i + 1).trim())];
      })
      .filter((a) => a.length === 2)
  );

const app = express();
const server = http.createServer(app);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (origin.endsWith(".onrender.com")) return true;
  if (process.env.FRONTEND_URL && (origin === process.env.FRONTEND_URL || origin.replace(/\/$/, "") === process.env.FRONTEND_URL.replace(/\/$/, ""))) return true;
  const defaults = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
  ];
  return defaults.includes(origin);
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Socket CORS rejected"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 20000,
  pingInterval: 25000,
  connectTimeout: 45000,
  maxHttpBufferSize: 1e7, // 10MB
});

// Map of userId -> array of active socket IDs
const userSocketMap = {};

export const getReceiverSocketIds = (receiverId) => {
  if (!receiverId) return [];
  return userSocketMap[String(receiverId)] || [];
};

export const getReceiverSocketId = (receiverId) => {
  const sockets = getReceiverSocketIds(receiverId);
  return sockets.length > 0 ? sockets[sockets.length - 1] : null;
};

// Handshake Authentication Middleware
io.use((socket, next) => {
  try {
    const cookies = parseCookies(socket.handshake.headers?.cookie);
    const token = cookies.jwt || socket.handshake.auth?.token;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded?.userId) {
          socket.userId = String(decoded.userId);
          socket.trusted = true;
          return next();
        }
      } catch (jwtErr) {
        console.warn(`[Socket Auth] Token verification failed: ${jwtErr.message}`);
      }
    }

    // Fallback for development environments or explicit query auth
    const queryUserId = socket.handshake.query?.userId;
    if (queryUserId && queryUserId !== "undefined" && mongoose.Types.ObjectId.isValid(queryUserId)) {
      socket.userId = String(queryUserId);
      socket.trusted = true;
      return next();
    }

    // If no valid auth provided
    return next(new Error("Authentication required for socket connection"));
  } catch (err) {
    return next(new Error("Internal socket authentication error"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.userId;
  console.log(`[Socket Connected] User: ${userId}, SocketId: ${socket.id}`);

  if (userId) {
    if (!userSocketMap[userId]) {
      userSocketMap[userId] = [];
    }
    if (!userSocketMap[userId].includes(socket.id)) {
      userSocketMap[userId].push(socket.id);
    }
  }

  // Broadcast online users
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Typing event
  socket.on("typing", ({ receiverId }) => {
    if (!receiverId || receiverId === "guppshup_ai_bot") return;
    const senderId = socket.userId;
    const receiverSocketIds = getReceiverSocketIds(receiverId);
    receiverSocketIds.forEach((socketId) => {
      io.to(socketId).emit("typing", { senderId });
    });
  });

  // Stop typing event
  socket.on("stopTyping", ({ receiverId }) => {
    if (!receiverId || receiverId === "guppshup_ai_bot") return;
    const senderId = socket.userId;
    const receiverSocketIds = getReceiverSocketIds(receiverId);
    receiverSocketIds.forEach((socketId) => {
      io.to(socketId).emit("stopTyping", { senderId });
    });
  });

  // WebRTC Signaling: Call user
  socket.on("callUser", ({ userToCall, signalData }) => {
    if (!userToCall || !signalData) return;
    const fromUserId = socket.userId;
    const receiverSocketIds = getReceiverSocketIds(userToCall);
    receiverSocketIds.forEach((socketId) => {
      io.to(socketId).emit("callUser", { signal: signalData, fromUserId });
    });
  });

  // WebRTC Signaling: Answer call
  socket.on("answerCall", ({ to, signal }) => {
    if (!to || !signal) return;
    const callerSocketIds = getReceiverSocketIds(to);
    callerSocketIds.forEach((socketId) => {
      io.to(socketId).emit("callAccepted", { signal });
    });
  });

  // WebRTC Signaling: ICE Candidate exchange
  socket.on("iceCandidate", ({ to, candidate }) => {
    if (!to || !candidate) return;
    const peerSocketIds = getReceiverSocketIds(to);
    peerSocketIds.forEach((socketId) => {
      io.to(socketId).emit("iceCandidate", { candidate });
    });
  });

  // WebRTC Signaling: End call
  socket.on("endCall", ({ to }) => {
    if (!to) return;
    const peerSocketIds = getReceiverSocketIds(to);
    peerSocketIds.forEach((socketId) => {
      io.to(socketId).emit("callEnded");
    });
  });

  // WebRTC Signaling: Decline call
  socket.on("declineCall", ({ to }) => {
    if (!to) return;
    const peerSocketIds = getReceiverSocketIds(to);
    peerSocketIds.forEach((socketId) => {
      io.to(socketId).emit("callDeclined");
    });
  });

  // Mark as read event
  socket.on("markAsRead", async ({ senderId, receiverId }) => {
    try {
      if (
        !senderId ||
        !receiverId ||
        receiverId === "guppshup_ai_bot" ||
        !mongoose.Types.ObjectId.isValid(senderId) ||
        !mongoose.Types.ObjectId.isValid(receiverId)
      ) {
        return;
      }
      // Ensure the caller is either the reader (receiver) or sender
      if (socket.userId !== String(receiverId) && socket.userId !== String(senderId)) {
        return;
      }

      await Message.updateMany(
        { senderId, receiverId, isRead: false },
        { $set: { isRead: true } }
      );
      const senderSocketIds = getReceiverSocketIds(senderId);
      senderSocketIds.forEach((socketId) => {
        io.to(socketId).emit("messagesRead", { readerId: receiverId });
      });
    } catch (error) {
      console.log("Error in markAsRead socket event", error.message);
    }
  });

  // Disconnection handler
  socket.on("disconnect", (reason) => {
    console.log(`[Socket Disconnected] SocketId: ${socket.id}, Reason: ${reason}`);
    if (userId && userSocketMap[userId]) {
      userSocketMap[userId] = userSocketMap[userId].filter((id) => id !== socket.id);
      if (userSocketMap[userId].length === 0) {
        delete userSocketMap[userId];
      }
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { app, io, server };
