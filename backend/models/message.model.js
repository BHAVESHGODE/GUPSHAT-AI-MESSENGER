// Import mongoose for schema definition
import mongoose from "mongoose";

// Define schema for a message between users
const messageSchema = new mongoose.Schema(
  {
    // Sender's user ID
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Receiver's user ID
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Message content
    message: {
      type: String,
      default: "",
    },
    // Message read status
    isRead: {
      type: Boolean,
      default: false,
    },
    // Media attachment fields
    fileUrl: {
      type: String,
      default: "",
    },
    fileType: {
      type: String,
      default: "", // "image", "video", "audio", "document"
    },
    fileName: {
      type: String,
      default: "",
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    // Emoji reactions array
    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        emoji: {
          type: String,
        },
      },
    ],
    // Quoted reply reference
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    // Edit & delete flags
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true } // Automatically add createdAt and updatedAt fields
);

// Create Message model from schema
const Message = mongoose.model("Message", messageSchema);

export default Message;