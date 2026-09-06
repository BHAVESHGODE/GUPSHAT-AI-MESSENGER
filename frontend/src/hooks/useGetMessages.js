import { useEffect, useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";

const useGetMessages = () => {
  const [loading, setLoading] = useState(false);
  const { messages, setMessages, selectedConversation } = useConversation();

  useEffect(() => {
    const getMessages = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/messages/${selectedConversation._id}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setMessages(data);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    // Fetch history for everything (incl. stateful 1-on-1 AI).
    // Only the stateless Group AI sandbox has no server history.
    if (selectedConversation?._id && selectedConversation._id !== "guppshup_ai_bot") {
      getMessages();
    } else if (selectedConversation?._id === "guppshup_ai_bot") {
      setMessages([]);
    }
  }, [selectedConversation?._id, setMessages]);

  return { messages, loading };
};
export default useGetMessages;
