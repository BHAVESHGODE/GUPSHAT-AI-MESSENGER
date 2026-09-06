import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

// 5 Cozy Local SVG Data URIs for offline avatar support
const localAvatars = [
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%233b82f6"/><circle cx="50" cy="45" r="20" fill="%23ffdbb5"/><path d="M30 70c0-10 10-15 20-15s20 5 20 15v10H30V70z" fill="%231e3a8a"/><circle cx="43" cy="42" r="3" fill="%23000"/><circle cx="57" cy="42" r="3" fill="%23000"/><path d="M46 52s2 3 4 3 4-3 4-3" stroke="%23000" stroke-width="2" fill="none"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23ec4899"/><circle cx="50" cy="45" r="20" fill="%23ffdbb5"/><path d="M30 70c0-10 10-15 20-15s20 5 20 15v10H30V70z" fill="%234c0519"/><circle cx="43" cy="42" r="3" fill="%23000"/><circle cx="57" cy="42" r="3" fill="%23000"/><path d="M46 52s2 3 4 3 4-3 4-3" stroke="%23000" stroke-width="2" fill="none"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%2310b981"/><circle cx="50" cy="45" r="20" fill="%23ffdbb5"/><path d="M30 70c0-10 10-15 20-15s20 5 20 15v10H30V70z" fill="%23064e3b"/><circle cx="43" cy="42" r="3" fill="%23000"/><circle cx="57" cy="42" r="3" fill="%23000"/><path d="M46 52s2 3 4 3 4-3 4-3" stroke="%23000" stroke-width="2" fill="none"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23f59e0b"/><circle cx="50" cy="45" r="20" fill="%23ffdbb5"/><path d="M30 70c0-10 10-15 20-15s20 5 20 15v10H30V70z" fill="%2378350f"/><circle cx="43" cy="42" r="3" fill="%23000"/><circle cx="57" cy="42" r="3" fill="%23000"/><path d="M46 52s2 3 4 3 4-3 4-3" stroke="%23000" stroke-width="2" fill="none"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%238b5cf6"/><circle cx="50" cy="45" r="20" fill="%23ffdbb5"/><path d="M30 70c0-10 10-15 20-15s20 5 20 15v10H30V70z" fill="%232e1065"/><circle cx="43" cy="42" r="3" fill="%23000"/><circle cx="57" cy="42" r="3" fill="%23000"/><path d="M46 52s2 3 4 3 4-3 4-3" stroke="%23000" stroke-width="2" fill="none"/></svg>'
];

const seedUsers = [
  { fullName: "Aarav Sharma", gender: "male", bio: "Full stack developer & chai lover. ☕" },
  { fullName: "Saanvi Patel", gender: "female", bio: "Design wizard. Crafting digital experiences. ✨" },
  { fullName: "Kabir Singh", gender: "male", bio: "Coffee, code, and music. 🎸" },
  { fullName: "Aanya Verma", gender: "female", bio: "Avid reader & amateur photographer. 📚" },
  { fullName: "Vihaan Gupta", gender: "male", bio: "Exploring AI, Web3 & new tech paradigms." },
  { fullName: "Aadhya Reddy", gender: "female", bio: "Product manager. Dog mom. 🐶" },
  { fullName: "Arjun Rao", gender: "male", bio: "Fitness enthusiast. Always building. 💪" },
  { fullName: "Ananya Sen", gender: "female", bio: "Finding magic in everyday details." },
  { fullName: "Krishna Nair", gender: "male", bio: "Coding by day, gaming by night. 🎮" },
  { fullName: "Diya Joshi", gender: "female", bio: "Content creator. Art enthusiast. 🎨" },
  { fullName: "Ishaan Mehta", gender: "male", bio: "Startup founder. Tech optimist." },
  { fullName: "Aaradhya Das", gender: "female", bio: "Pianist. Matcha latte fan. 🍵" },
  { fullName: "Reyansh Kumar", gender: "male", bio: "Casual photographer. Explorer. 📸" },
  { fullName: "Pari Saxena", gender: "female", bio: "Frontend developer. Travel bug. ✈️" },
  { fullName: "Atharv Mishra", gender: "male", bio: "Always learning. Stay curious." },
  { fullName: "Neha Deshmukh", gender: "female", bio: "Software engineer & digital artist. 💻" },
  { fullName: "Shaurya Bhatia", gender: "male", bio: "Sports buff. Cricket is life. 🏏" },
  { fullName: "Priya Pillai", gender: "female", bio: "Writing codes and poems." },
  { fullName: "Rohit Malhotra", gender: "male", bio: "Product developer & tech geek. 🤓" },
  { fullName: "Sneha Hegde", gender: "female", bio: "Living life one adventure at a time." },
  { fullName: "Aditya Choudhury", gender: "male", bio: "Data analyst. Chess player. ♟️" },
  { fullName: "Riya Mukherjee", gender: "female", bio: "Web developer. Cat person. 🐱" },
  { fullName: "Amit Banerjee", gender: "male", bio: "Guitarist & cybersecurity analyst." },
  { fullName: "Pooja Kulkarni", gender: "female", bio: "Just checking out the new chat app!" },
  { fullName: "Sanjay Dutta", gender: "male", bio: "UI/UX enthusiast. Minimalist." },
  { fullName: "Divya Kapoor", gender: "female", bio: "Dreamer. Believer. Achiever." },
  { fullName: "Rahul Menon", gender: "male", bio: "Biker. Wanderer. Code compiler. 🏍️" },
  { fullName: "Kavita Rao", gender: "female", bio: "Journalist & storyteller." },
  { fullName: "Vijay Iyer", gender: "male", bio: "Backend architect. Cloud builder. ☁️" },
  { fullName: "Meera Nair", gender: "female", bio: "Graphic designer. Plant parent. 🌱" },
  { fullName: "Deepak Rawat", gender: "male", bio: "Running enthusiast & programmer." },
  { fullName: "Anjali Dubey", gender: "female", bio: "Sunsets and good conversations." },
  { fullName: "Rajesh Goswami", gender: "male", bio: "Tech consultant. Movie reviewer. 🎬" },
  { fullName: "Kiran Mahajan", gender: "female", bio: "Baking code & cakes. 🍰" },
  { fullName: "Sandeep Yadav", gender: "male", bio: "DevOps specialist. Coffee snob." },
  { fullName: "Swati Negi", gender: "female", bio: "UI Designer. Trekking lover." },
  { fullName: "Manoj Tripathi", gender: "male", bio: "Financial analyst & tech investor." },
  { fullName: "Jyoti Sharma", gender: "female", bio: "Learning piano. Love classical music." },
  { fullName: "Alok Pandey", gender: "male", bio: "Android developer. Gamer." },
  { fullName: "Shalini Varma", gender: "female", bio: "Life is short, code clean." },
  { fullName: "Ajay Shekhawat", gender: "male", bio: "Embedded systems engineer." },
  { fullName: "Preeti Thakur", gender: "female", bio: "Exploring cuisines and cultures. 🍲" },
  { fullName: "Sunil Wadhwa", gender: "male", bio: "Software testing lead. Traveler." },
  { fullName: "Tanvi Somani", gender: "female", bio: "Marketing head. Fitness lover." },
  { fullName: "Vikram Rathi", gender: "male", bio: "Data engineer. Math lover." },
  { fullName: "Ira Singhal", gender: "female", bio: "Web Accessibility advocate." },
  { fullName: "Dinesh Bisht", gender: "male", bio: "System admin. Tech tinker." },
  { fullName: "Pihu Goel", gender: "female", bio: "Illustration designer." },
  { fullName: "Suresh Gowda", gender: "male", bio: "AI Researcher. Deep learning fan." },
  { fullName: "Khushi Shah", gender: "female", bio: "UI Developer. Coffee lover." }
];

export const seedDatabase = async () => {
  try {
    // Backfill: give every old user without email a deterministic email so new required field passes
    const missingEmail = await User.find({ $or: [{ email: { $exists: false } }, { email: null }, { email: "" }] });
    for (const u of missingEmail) {
      const base = (u.username || u.fullName || "user").toLowerCase().replace(/[^a-z0-9]+/g, "");
      u.email = `${base || "user"}${u._id.toString().slice(-4)}@example.com`;
      try {
        await u.save();
      } catch {}
    }
    if (missingEmail.length) console.log(`Backfilled email for ${missingEmail.length} old users`);

    // Delete any users who were seeded previously (usernames ending in digits) to clean up broken URLs
    await User.deleteMany({ username: /[a-z]+\d+$/ });

    const count = await User.countDocuments();
    // If the database has fewer than 10 users, seed 50 new ones
    if (count < 10) {
      console.log("Seeding database with 50 realistic Indian users using local SVG Data URIs...");
      const salt = await bcrypt.genSalt(10);
      const defaultPassword = await bcrypt.hash("password123", salt);

      const usersToInsert = seedUsers.map((user, idx) => {
        const username = user.fullName.toLowerCase().replace(/\s+/g, "") + idx;
        const profilePic = localAvatars[idx % localAvatars.length];

        // Distribute statuses
        const statuses = ["Active", "Away", "Do Not Disturb"];
        const status = statuses[idx % statuses.length];

        return {
          fullName: user.fullName,
          username,
          email: `${username}@example.com`,
          password: defaultPassword,
          gender: user.gender,
          profilePic,
          bio: user.bio,
          status,
        };
      });

      await User.insertMany(usersToInsert);
      console.log("Successfully seeded 50 realistic Indian users into MongoDB!");
    } else {
      console.log(`Database already has ${count} users. Seeding skipped.`);
    }
  } catch (error) {
    console.error("Error seeding database:", error.message);
  }
};
