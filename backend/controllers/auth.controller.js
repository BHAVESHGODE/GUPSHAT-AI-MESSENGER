import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/user.model.js";
import generateTokenAndSetCookie from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toAuthJson = (u) => ({
  _id: u._id,
  fullName: u.fullName,
  username: u.username,
  email: u.email,
  profilePic: u.profilePic,
  bio: u.bio,
  status: u.status,
});

export const signup = async (req, res) => {
  try {
    const { fullName, username, email, password, confirmPassword, gender } = req.body;
    if (!fullName || !username || !email || !password || !gender) {
      return res.status(400).json({ error: "Please fill in all fields" });
    }
    if (fullName.trim().length < 2 || fullName.trim().length > 100) {
      return res.status(400).json({ error: "Name must be 2-100 characters" });
    }
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: "Username must be 3-30 characters" });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: "Username can only contain letters, numbers, and underscores" });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    if (!["male", "female", "other"].includes(gender)) {
      return res.status(400).json({ error: "Invalid gender value" });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const [emailExists, userExists] = await Promise.all([
      User.findOne({ email: normalizedEmail }),
      User.findOne({ username }),
    ]);
    if (emailExists) return res.status(400).json({ error: "Email already exists" });
    if (userExists) return res.status(400).json({ error: "Username already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
    const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`;

    const newUser = new User({
      fullName,
      username,
      email: normalizedEmail,
      password: hashedPassword,
      gender,
      profilePic: gender === "male" ? boyProfilePic : girlProfilePic,
    });
    await newUser.save();
    generateTokenAndSetCookie(newUser._id, res);
    res.status(201).json(toAuthJson(newUser));
  } catch (error) {
    console.log("Error in signup controller", error.message);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(400).json({ error: `${field} already exists` });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  try {
    const { username, email, identifier, password } = req.body;
    const loginId = (identifier || email || username || "").trim();
    if (!loginId || !password) {
      return res.status(400).json({ error: "Please fill in all fields" });
    }
    const isEmail = emailRegex.test(loginId);
    const user = isEmail
      ? await User.findOne({ email: loginId.toLowerCase() })
      : await User.findOne({ $or: [{ username: loginId }, { email: loginId.toLowerCase() }] });
    const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");
    if (!user || !isPasswordCorrect) {
      return res.status(400).json({ error: "Invalid username or password" });
    }
    generateTokenAndSetCookie(user._id, res);
    res.status(200).json(toAuthJson(user));
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(200).json({ message: "If that email exists, a reset link was sent." });
    }
    const resetToken = crypto.randomBytes(32).toString("hex");
    // Store only a hash — a DB read must never leak live reset links.
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const frontendBase = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
    const resetUrl = `${frontendBase}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset - GuppShup Chat",
        text: `Reset your GuppShup password: ${resetUrl}\nThis link expires in 15 minutes.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h2 style="color:#c2410c">Password Reset</h2><p>Click below to reset your GuppShup password. Expires in 15 minutes.</p><p><a href="${resetUrl}" style="background:#c2410c;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Reset Password</a></p><p>Or paste: ${resetUrl}</p></div>`,
      });
    } catch (mailErr) {
      console.error("Email sending failed:", mailErr.message);
      // Token was never delivered — nullify it so it can't linger valid.
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, error: "Email could not be sent. Please try again." });
    }
    res.status(200).json({ message: "Password reset email sent. Check your inbox." });
  } catch (error) {
    console.log("Error in forgotPassword", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword, password } = req.body;
    const finalPass = newPassword || password;
    if (!finalPass || finalPass.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const tokenHash = crypto.createHash("sha256").update(String(token)).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ error: "Invalid or expired reset token" });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(finalPass, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.status(200).json({ message: "Password reset successful. Please login." });
  } catch (error) {
    console.log("Error in resetPassword", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
