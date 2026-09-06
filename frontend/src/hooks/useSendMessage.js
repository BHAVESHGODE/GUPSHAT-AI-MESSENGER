import { useState } from "react";
import useConversation from "../zustand/useConversation";
import { useAuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";

const useSendMessage = () => {
  const [loading, setLoading] = useState(false);
  const { setMessages, selectedConversation } = useConversation();
  const { handleSessionExpired } = useAuthContext();

  const sendMessage = async (payload, options = {}) => {
    // Handle simple string or object payload
    const bodyPayload = typeof payload === "string" ? { message: payload } : payload;
    const { optimisticId } = options;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/messages/send/${selectedConversation._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bodyPayload),
        }
      );
      const data = await res.json();
      if (res.status === 401 || res.status === 404 || data.error === "User not found") {
        if (handleSessionExpired) handleSessionExpired();
        toast.error("Session expired or user not found. Please log in again.");
        return null;
      }
      if (data.error) throw new Error(data.error);

      if (optimisticId) {
        setMessages((prev) => prev.map((m) => (m._id === optimisticId ? data : m)));
      } else {
        setMessages((prev) =>
          prev.some((m) => m._id === data._id) ? prev : [...prev, data]
        );
      }
      return data;
    } catch (error) {
      toast.error(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading };
};

export default useSendMessage;
