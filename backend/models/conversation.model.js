// Import mongoose for schema definition
import mongoose from "mongoose";

// Define schema for a conversation (Direct or Group) between users
const conversationSchema = new mongoose.Schema(
  {
    // Group indicator
    isGroup: {
      type: Boolean,
      default: false,
    },
    // Group details
    groupName: {
      type: String,
      default: "",
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    groupPic: {
      type: String,
      default: "",
    },
    // Disappearing messages timer ("off", "5m", "1h", "24h")
    disappearingTimer: {
      type: String,
      default: "off",
    },
    // Array of user IDs participating in the conversation
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Array of message IDs belonging to the conversation
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: [],
      },
    ],
  },
  { timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
