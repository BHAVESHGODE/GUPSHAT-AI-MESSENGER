// Import JWT for token verification and User model
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// Middleware to protect routes by verifying JWT and user existence
const protectRoute = async (req, res, next) => {
  try {
    // Get JWT token from cookies
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized - No Token Provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      res.clearCookie("jwt");
      return res.status(401).json({ error: "Unauthorized - Invalid Token" });
    }

    if (!decoded) {
      res.clearCookie("jwt");
      return res.status(401).json({ error: "Unauthorized - Invalid Token" });
    }

    // Find user by decoded userId, exclude password
    const user = await User.findById(decoded.userId).select("-password -resetPasswordToken -resetPasswordExpires");
    if (!user) {
      res.clearCookie("jwt");
      return res.status(404).json({ error: "User not found" });
    }

    // Attach user to request object for downstream use
    req.user = user;
    next(); // Continue to next middleware/route handler
  } catch (error) {
    // Handle errors
    console.log("Error in protectRoute middleware: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Export middleware for use in route protection
export default protectRoute;