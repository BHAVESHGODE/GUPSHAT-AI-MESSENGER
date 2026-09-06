import mongoose from "mongoose";

const callLogSchema = new mongoose.Schema(
  {
    callerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    callType: {
      type: String,
      enum: ["audio", "video"],
      required: true,
    },
    status: {
      type: String,
      enum: ["completed", "missed", "declined", "ended"],
      required: true,
    },
    duration: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const CallLog = mongoose.model("CallLog", callLogSchema);
export default CallLog;
