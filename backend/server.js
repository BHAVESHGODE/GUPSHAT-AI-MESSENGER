// Import core modules and middleware
import path from "path"; // Node.js utility for file paths
import { fileURLToPath } from "url"; // For ESM __dirname/__filename
import express from "express"; // Express framework
import dotenv from "dotenv"; // Loads environment variables
import cookieParser from "cookie-parser"; // Parses cookies from requests
import cors from "cors"; // Enables Cross-Origin Resource Sharing
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";

// Import route handlers
import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import userRoutes from "./routes/user.routes.js";
import groupRoutes from "./routes/group.routes.js";
import aiRoutes from "./routes/ai.routes.js";

// Import database connection and socket setup
import connectToMongoDB from "./db/connectToMongoDB.js";
import { app, server } from "./socket/socket.js";

// Resolve __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, ".env") });

// Set the server port from environment or default to 5000
const PORT = process.env.PORT || 5000;

// Enable CORS for the frontend origin and allow credentials (cookies)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Apply comprehensive security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled to allow external avatars (Dicebear, Unsplash, Cloudinary)
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xContentTypeOptions: true,
    xFrameOptions: { action: "sameorigin" },
    xDnsPrefetchControl: { allow: false },
  })
);

// Apply rate limiting to all api endpoints in production mode
if (process.env.NODE_ENV === "production") {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests from this IP, please try again later." },
  });
  app.use("/api", limiter);
}

// Strict rate limiting on auth endpoints (production only)
if (process.env.NODE_ENV === "production") {
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: "Too many attempts. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { error: "Too many reset requests. Try again in an hour." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/signup", authLimiter);
  app.use("/api/auth/forgot-password", forgotPasswordLimiter);
}

// Parse incoming JSON requests and cookies (with body size limit)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Global input sanitization helper middleware to mitigate script injection
const sanitizePayload = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "string") {
      // Remove dangerous script tags and null bytes
      obj[key] = obj[key].replace(/\0/g, "").replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    } else if (typeof obj[key] === "object") {
      sanitizePayload(obj[key]);
    }
  }
  return obj;
};

app.use((req, res, next) => {
  if (req.body) sanitizePayload(req.body);
  if (req.query) sanitizePayload(req.query);
  next();
});

// Mount API route handlers
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/ai", aiRoutes);

// Serve static uploaded files (audio notes, images, documents, videos)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve static files from the frontend build directory
app.use(express.static(path.join(__dirname, "..", "frontend", "dist")));

// For any other route, serve the frontend's index.html (SPA fallback)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

// Process-level crash handlers
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

// Graceful shutdown on termination signals
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Gracefully shutting down server and database...`);
  server.close(async () => {
    console.log("HTTP & Socket server closed.");
    try {
      await mongoose.connection.close(false);
      console.log("MongoDB connection pool closed.");
      process.exit(0);
    } catch (e) {
      console.error("Error closing MongoDB pool:", e.message);
      process.exit(1);
    }
  });
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Start the server and connect to MongoDB
server.listen(PORT, () => {
  connectToMongoDB();
  console.log(`Server Running on port ${PORT}`);
});

