import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "backend/.env" });

const userSchema = new mongoose.Schema({
  fullName: String,
  username: String,
});
const User = mongoose.model("User", userSchema);

async function check() {
  await mongoose.connect(process.env.MONGO_DB_URI);
  const users = await User.find({}).limit(10);
  console.log("Users:", users.map(u => ({ id: u._id, fullName: u.fullName, username: u.username })));
  const pratik = await User.findOne({ username: /pratik/i });
  console.log("Pratik user:", pratik);
  process.exit(0);
}
check();
