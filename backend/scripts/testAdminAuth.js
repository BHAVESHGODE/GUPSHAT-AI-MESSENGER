import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/user.model.js";

dotenv.config();

async function test() {
  await mongoose.connect(process.env.MONGO_DB_URI);

  const admin = await User.findOne({ email: "bhaveshgode676@gmail.com" });
  const regularUser = await User.findOne({ email: { $ne: "bhaveshgode676@gmail.com" } });

  console.log("Admin user:", admin.email);
  console.log("Regular user:", regularUser.email);

  const adminToken = jwt.sign({ userId: admin._id }, process.env.JWT_SECRET, { expiresIn: "15d" });
  const regularToken = jwt.sign({ userId: regularUser._id }, process.env.JWT_SECRET, { expiresIn: "15d" });

  // 1. Admin accessing stats
  const statsAdmin = await fetch("http://localhost:5004/api/ai/feedback/stats", {
    headers: { Cookie: "jwt=" + adminToken },
  });
  console.log("1. Admin Stats Access Status (200 expected):", statsAdmin.status, (await statsAdmin.json()).summary);

  // 2. Admin exporting dataset
  const exportAdmin = await fetch("http://localhost:5004/api/ai/feedback/export?format=jsonl", {
    headers: { Cookie: "jwt=" + adminToken },
  });
  console.log("2. Admin Export Access Status (200 expected):", exportAdmin.status);

  // 3. Regular user accessing stats (Forbidden)
  const statsRegular = await fetch("http://localhost:5004/api/ai/feedback/stats", {
    headers: { Cookie: "jwt=" + regularToken },
  });
  console.log("3. Regular User Stats Access Status (403 expected):", statsRegular.status, await statsRegular.json());

  // 4. Regular user exporting dataset (Forbidden)
  const exportRegular = await fetch("http://localhost:5004/api/ai/feedback/export?format=jsonl", {
    headers: { Cookie: "jwt=" + regularToken },
  });
  console.log("4. Regular User Export Access Status (403 expected):", exportRegular.status, await exportRegular.json());

  await mongoose.disconnect();
  process.exit(0);
}

test();
