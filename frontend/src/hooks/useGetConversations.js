import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";
import useConversation from "../zustand/useConversation";

const useGetConversations = () => {
  const [loading, setLoading] = useState(false);
  const { conversations, setConversations } = useConversation();
  const { handleSessionExpired } = useAuthContext();

  useEffect(() => {
    const getConversations = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        if (res.status === 401 || res.status === 404 || data.error === "User not found") {
          if (handleSessionExpired) handleSessionExpired();
          return;
        }
        if (data.error) {
          throw new Error(data.error);
        }
        setConversations(data);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    getConversations();
  }, [handleSessionExpired]);

  return { loading, conversations };
};
export default useGetConversations;
