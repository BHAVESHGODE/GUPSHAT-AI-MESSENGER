// Import Mongoose for MongoDB connection
import mongoose from "mongoose";
import { seedDatabase } from "./seed.js";

// Connection status listeners
mongoose.connection.on("connected", () => {
  console.log("[MongoDB] Database connection established successfully");
});

mongoose.connection.on("error", (err) => {
  console.error("[MongoDB] Connection error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("[MongoDB] Lost MongoDB connection. Auto-reconnecting...");
});

mongoose.connection.on("reconnected", () => {
  console.log("[MongoDB] Reconnected to MongoDB successfully");
});

// Async function to connect to MongoDB using environment variable URI
const connectToMongoDB = async () => {
  try {
    const mongoUri = process.env.MONGO_DB_URI;
    if (!mongoUri) {
      throw new Error("MONGO_DB_URI is not defined in environment variables");
    }

    await mongoose.connect(mongoUri, {
      maxPoolSize: 50,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
    });

    console.log("Connected to MongoDB with resilient connection pool");
    if (process.env.NODE_ENV !== "production") {
      await seedDatabase();
    }
  } catch (error) {
    console.error("Critical error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

// Export the connection function for use in server setup
export default connectToMongoDB;

