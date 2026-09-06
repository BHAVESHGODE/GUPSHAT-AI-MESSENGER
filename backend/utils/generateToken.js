// Import JWT for token generation
import jwt from "jsonwebtoken";

// Generate JWT token and set it as an HTTP-only cookie in the response
const generateTokenAndSetCookie = (userId, res) => {
  // Create a JWT token with userId as payload, expires in 7 days
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  // Set the token as a cookie named 'jwt' with security options
  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    httpOnly: true, // Prevent client-side JS access
    sameSite: "lax", // Allow cookie on same-site + top-level navigations (works over plain HTTP localhost)
    secure: process.env.NODE_ENV === "production", // Secure cookies only over HTTPS in production
  });
};

// Export the function for use in authentication controllers
export default generateTokenAndSetCookie;
