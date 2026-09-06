// Import React context and hooks
import { createContext, useState, useEffect, useContext } from "react";
import { useAuthContext } from "./AuthContext"; // Custom auth context hook
import io from "socket.io-client"; // Socket.IO client for real-time communication

// Create socket context
const SocketContext = createContext();

// Custom hook to access SocketContext
export const useSocketContext = () => {
  return useContext(SocketContext);
};

// Provider component to manage socket connection and online users
export const SocketContextProvider = ({ children }) => {
  // State for socket instance
  const [socket, setSocket] = useState(null);
  // State for list of online users
  const [onlineUsers, setOnlineUsers] = useState([]);
  // Connection state indicator
  const [isConnected, setIsConnected] = useState(false);
  // Get authenticated user from auth context
  const { authUser } = useAuthContext();

  // Effect to connect/disconnect socket based on authentication
  useEffect(() => {
    if (authUser) {
      const socketURL =
        import.meta.env.VITE_BACKEND_URL ||
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
          ? "http://localhost:5004"
          : window.location.origin);

      // Connect to backend socket server with resilient retry parameters
      const socketInstance = io(socketURL, {
        query: {
          userId: authUser._id,
        },
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ["websocket", "polling"],
      });

      setSocket(socketInstance);

      socketInstance.on("connect", () => {
        setIsConnected(true);
        console.log("[Socket] Connected successfully with ID:", socketInstance.id);
      });

      socketInstance.on("disconnect", (reason) => {
        setIsConnected(false);
        console.warn("[Socket] Disconnected:", reason);
        if (reason === "io server disconnect") {
          // Reconnect manually if disconnected by the server
          socketInstance.connect();
        }
      });

      socketInstance.on("connect_error", (err) => {
        setIsConnected(false);
        console.warn("[Socket] Connection error:", err.message);
      });

      socketInstance.on("reconnect", (attemptNumber) => {
        setIsConnected(true);
        console.log(`[Socket] Reconnected after ${attemptNumber} attempts`);
      });

      // Listen for online users list from server
      socketInstance.on("getOnlineUsers", (users) => {
        setOnlineUsers(users);
      });

      // Network lifecycle handling (reconnect immediately when device comes back online)
      const handleOnline = () => {
        console.log("[Network] Device is online, reconnecting socket...");
        if (socketInstance && !socketInstance.connected) {
          socketInstance.connect();
        }
      };

      const handleOffline = () => {
        console.warn("[Network] Device is offline");
        setIsConnected(false);
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // Cleanup: close socket on unmount or logout
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        socketInstance.close();
      };
    } else {
      // If not authenticated, close socket if open
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [authUser]);

  // Provide socket, onlineUsers, and isConnected to all child components
  return (
    <SocketContext.Provider value={{ socket, onlineUsers, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

