import mongoose from "mongoose";

const aiFeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    characterId: {
      type: String,
      required: true,
      default: "kabir",
      index: true,
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    userPrompt: {
      type: String,
      default: "",
    },
    aiResponse: {
      type: String,
      required: true,
    },
    rating: {
      type: String,
      enum: ["positive", "negative"],
      required: true,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    comment: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

// Compound index for querying character feedback quickly
aiFeedbackSchema.index({ characterId: 1, rating: 1, createdAt: -1 });

const AIFeedback = mongoose.model("AIFeedback", aiFeedbackSchema);

export default AIFeedback;
