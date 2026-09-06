import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_DB_URI);
    console.log("Connected to MongoDB");

    let admin = await User.findOne({ 
      $or: [
        { email: "bhaveshgode676@gmail.com" },
        { username: "bhaveshgode676@gmail.com" },
        { username: "bhavesh_admin" }
      ]
    });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("123456", salt);

    if (!admin) {
      admin = new User({
        fullName: "Bhavesh Gode (Admin)",
        username: "bhaveshgode676",
        email: "bhaveshgode676@gmail.com",
        password: hashedPassword,
        gender: "male",
        profilePic: "https://avatar.iran.liara.run/public/boy?username=bhavesh",
      });
      await admin.save();
      console.log("Created Admin User:", admin.email, "ID:", admin._id);
    } else {
      admin.email = "bhaveshgode676@gmail.com";
      admin.password = hashedPassword;
      await admin.save();
      console.log("Updated Admin User Password to '123456':", admin.email, "ID:", admin._id);
    }

    await mongoose.disconnect();
    console.log("Done!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
