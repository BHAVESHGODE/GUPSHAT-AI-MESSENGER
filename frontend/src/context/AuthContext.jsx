// Import React context and hooks
import { createContext, useContext, useState } from "react";

// Create authentication context
export const AuthContext = createContext();

// Custom hook to access AuthContext
// eslint-disable-next-line react-refresh/only-export-components
export const useAuthContext = () => {
  return useContext(AuthContext);
};

// Provider component to manage authentication state and provide it to children
export const AuthContextProvider = ({ children }) => {
  // State for authenticated user, initialized from localStorage
  const [authUser, setAuthUser] = useState(
    JSON.parse(localStorage.getItem("chat-user")) || null
  );

  const handleSessionExpired = () => {
    localStorage.removeItem("chat-user");
    setAuthUser(null);
  };

  // Provide authUser, setAuthUser, and handleSessionExpired to all child components
  return (
    <AuthContext.Provider value={{ authUser, setAuthUser, handleSessionExpired }}>
      {children}
    </AuthContext.Provider>
  );
};
