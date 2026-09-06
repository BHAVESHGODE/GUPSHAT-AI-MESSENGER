// Import routing components, styles, pages, and context
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import SignUp from "./pages/signup/Signup";
import Profile from "./pages/profile/Profile";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import { Toaster } from "react-hot-toast";
import { useAuthContext } from "./context/AuthContext";
import { useCall } from "./context/CallContext";
import CallingModal from "./components/messages/CallingModal";

// Main App component for routing and authentication
function App() {
  // Get authenticated user from context
  const { authUser } = useAuthContext();
  const { callStatus } = useCall();
  return (
    // Center the app vertically and horizontally
    <div className="flex items-center justify-center h-auto min-h-[100vh] w-full p-4 md:p-8 relative overflow-hidden text-[var(--text-main)] transition-colors duration-500 ease-in-out">
      {/* Pinterest-inspired glowing backdrop blobs */}
      <div className="absolute top-[10%] left-[10%] w-[300px] h-[300px] bg-purple-600/15 rounded-full filter blur-[80px] animate-pulse pointer-events-none -z-10" />
      <div className="absolute bottom-[10%] right-[10%] w-[350px] h-[350px] bg-pink-500/10 rounded-full filter blur-[90px] animate-pulse pointer-events-none -z-10" style={{ animationDuration: "6s" }} />
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[450px] h-[250px] bg-blue-500/5 rounded-full filter blur-[110px] pointer-events-none -z-10" />

      {/* Define application routes */}
      <Routes>
        {/* Home route: show Home if authenticated, else redirect to login */}
        <Route
          path="/"
          element={authUser ? <Home /> : <Navigate to={"/login"} />}
        />
        {/* Profile route: show Profile if authenticated, else redirect to login */}
        <Route
          path="/profile"
          element={authUser ? <Profile /> : <Navigate to={"/login"} />}
        />
        {/* Login route: redirect to Home if authenticated, else show Login */}
        <Route
          path="/login"
          element={authUser ? <Navigate to="/" /> : <Login />}
        />
        {/* Signup route: redirect to Home if authenticated, else show Signup */}
        <Route
          path="/signup"
          element={authUser ? <Navigate to="/" /> : <SignUp />}
        />
        <Route path="/forgot-password" element={authUser ? <Navigate to="/" /> : <ForgotPassword />} />
        <Route path="/reset-password/:token" element={authUser ? <Navigate to="/" /> : <ResetPassword />} />
      </Routes>
      {/* Toast notifications for feedback */}
      <Toaster />

      {/* Global Peer-to-Peer Calling Window Overlay */}
      {callStatus !== "idle" && <CallingModal />}
    </div>
  );
}

export default App;
