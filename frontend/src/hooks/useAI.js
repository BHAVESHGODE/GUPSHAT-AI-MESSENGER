import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";

const useAI = () => {
  const [loading, setLoading] = useState(false);
  const { handleSessionExpired } = useAuthContext();

  const getCharacters = async () => {
    try {
      const res = await fetch("/api/ai/characters");
      const data = await res.json();
      if (res.status === 401 || res.status === 404 || data.error === "User not found") {
        if (handleSessionExpired) handleSessionExpired();
      }
      return data;
    } catch {
      return [];
    }
  };

  const askAI = async (prompt, characterId = "kabir", conversationHistory = []) => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, characterId, conversationHistory }),
      });
      const data = await res.json();
      if (res.status === 401 || res.status === 404 || data.error === "User not found") {
        if (handleSessionExpired) handleSessionExpired();
        toast.error("Session expired or user not found. Please log in again.");
        return null;
      }
      if (data.error) throw new Error(data.error);
      return data.responses || (data.response ? [data.response] : []);
    } catch (err) {
      toast.error("AI Error: " + err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const translateText = async (text, targetLanguage) => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLanguage }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data.translatedText;
    } catch (err) {
      toast.error("Translation Error: " + err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getSmartReplies = async (lastMessage) => {
    try {
      const res = await fetch("/api/ai/smart-replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastMessage }),
      });
      const data = await res.json();
      return data.suggestions || [];
    } catch (err) {
      return [];
    }
  };

  const toggleBlockUser = async (userId) => {
    try {
      const res = await fetch(`/api/users/block/${userId}`, {
        method: "PUT",
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(data.message);
      return data;
    } catch (err) {
      toast.error(err.message);
      return null;
    }
  };

  return { askAI, getCharacters, translateText, getSmartReplies, toggleBlockUser, loading };
};

export default useAI;
