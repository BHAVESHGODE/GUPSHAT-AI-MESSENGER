// Import mongoose for schema definition
import mongoose from "mongoose";

// Define schema for a user
const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female"],
    },
    profilePic: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "Hey there! I am using GuppShup.",
    },
    status: {
      type: String,
      default: "Active",
      enum: ["Active", "Away", "Do Not Disturb"],
    },
    // Array of blocked user ObjectIds
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
