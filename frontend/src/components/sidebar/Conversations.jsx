import { useEffect, useState } from "react";
import useGetConversations from "../../hooks/useGetConversations";
import useGroup from "../../hooks/useGroup";
import useConversation from "../../zustand/useConversation";
import { useSocketContext } from "../../context/SocketContext";
import Conversation from "./Conversation";

const aiContact = {
  _id: "guppshup_ai_bot",
  isAI: true,
  fullName: "GuppShup AI 🤖",
  username: "guppshup_ai",
  profilePic: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=GuppShupAIBot&backgroundColor=c0aede",
  bio: "Ask me anything! Powered by AI.",
  status: "Active",
};

const Conversations = ({ activeTab = "all" }) => {
  const { loading: loadingDirects, conversations: directConversations } = useGetConversations();
  const { getGroups } = useGroup();
  const { searchQuery } = useConversation();
  const { socket } = useSocketContext();
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Pinned Conversations State (GuppShup AI pinned by default)
  const [pinnedIds, setPinnedIds] = useState(() => {
    try {
      const stored = localStorage.getItem("guppshup-pinned");
      const unpinned = JSON.parse(localStorage.getItem("guppshup-unpinned") || "[]");
      let list = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(list)) list = [];

      // If user hasn't explicitly unpinned GuppShup AI, ensure it is pinned
      if (!unpinned.includes("guppshup_ai_bot") && !list.includes("guppshup_ai_bot")) {
        list.unshift("guppshup_ai_bot");
        localStorage.setItem("guppshup-pinned", JSON.stringify(list));
      }
      return list;
    } catch {
      return ["guppshup_ai_bot"];
    }
  });

  const togglePin = (id) => {
    setPinnedIds((prev) => {
      const isCurrentlyPinned = prev.includes(id);
      const next = isCurrentlyPinned ? prev.filter((pId) => pId !== id) : [id, ...prev];
      localStorage.setItem("guppshup-pinned", JSON.stringify(next));

      try {
        const unpinned = JSON.parse(localStorage.getItem("guppshup-unpinned") || "[]");
        if (isCurrentlyPinned) {
          if (!unpinned.includes(id)) unpinned.push(id);
        } else {
          const filtered = unpinned.filter((uId) => uId !== id);
          localStorage.setItem("guppshup-unpinned", JSON.stringify(filtered));
        }
      } catch (e) {
        console.error(e);
      }

      return next;
    });
  };

  const fetchGroupChats = async () => {
    setLoadingGroups(true);
    const data = await getGroups();
    setGroups(data || []);
    setLoadingGroups(false);
  };

  useEffect(() => {
    fetchGroupChats();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewGroup = (newGroup) => {
      setGroups((prev) => [newGroup, ...prev.filter((g) => g._id !== newGroup._id)]);
    };

    const handleGroupUpdated = (updatedGroup) => {
      setGroups((prev) =>
        prev.map((g) => (g._id === updatedGroup._id ? updatedGroup : g))
      );
    };

    socket.on("newGroupCreated", handleNewGroup);
    socket.on("groupUpdated", handleGroupUpdated);

    return () => {
      socket.off("newGroupCreated", handleNewGroup);
      socket.off("groupUpdated", handleGroupUpdated);
    };
  }, [socket]);

  const isAIUser = (c) => {
    if (!c) return false;
    return Boolean(c._id === "guppshup_ai_bot" || c.isAI || c.isIndividualAI || (c.username && c.username.startsWith("ai_")));
  };

  let allItems = [];
  if (activeTab === "all") {
    allItems = [aiContact, ...groups, ...directConversations];
  } else if (activeTab === "direct") {
    // Genuine human users ONLY under Direct tab
    allItems = directConversations.filter((c) => !isAIUser(c));
  } else if (activeTab === "ai") {
    // AI Bots & Characters ONLY under AI tab
    allItems = [aiContact, ...directConversations.filter((c) => isAIUser(c))];
  } else if (activeTab === "groups") {
    allItems = groups;
  }

  // Filter items by searchQuery
  const filteredItems = allItems.filter((item) => {
    const name = item.isGroup ? item.groupName : item.fullName;
    return (name || "").toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Sort pinned items to the top, with guppshup_ai_bot at the very top of pinned chats
  const sortedItems = [...filteredItems].sort((a, b) => {
    const isAPinned = pinnedIds.includes(a._id);
    const isBPinned = pinnedIds.includes(b._id);
    if (isAPinned && !isBPinned) return -1;
    if (!isAPinned && isBPinned) return 1;
    if (isAPinned && isBPinned) {
      if (a._id === "guppshup_ai_bot") return -1;
      if (b._id === "guppshup_ai_bot") return 1;
    }
    const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return timeB - timeA;
  });

  const loading = loadingDirects || loadingGroups;

  return (
    <div className="py-2 flex flex-col overflow-y-auto flex-1 gap-1">
      {sortedItems.map((item, idx) => (
        <Conversation
          key={item._id}
          conversation={item}
          isPinned={pinnedIds.includes(item._id)}
          onTogglePin={togglePin}
          lastIdx={idx === sortedItems.length - 1}
        />
      ))}

      {loading ? <span className="loading loading-spinner mx-auto text-purple-400 mt-4"></span> : null}
      {!loading && sortedItems.length === 0 && (
        <div className="text-center text-xs text-slate-400 mt-8">No chats found</div>
      )}
    </div>
  );
};

export default Conversations;