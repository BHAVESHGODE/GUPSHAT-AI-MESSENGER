import { useState } from "react";
import { useSocketContext } from "../../context/SocketContext";
import useConversation from "../../zustand/useConversation";
import { FaUsers, FaRobot, FaThumbtack } from "react-icons/fa";
import Avatar from "../Avatar";

const Conversation = ({ conversation, lastIdx, isPinned = false, onTogglePin }) => {
  const { selectedConversation, setSelectedConversation } = useConversation();
  const { onlineUsers } = useSocketContext();

  const isSelected = selectedConversation?._id === conversation._id;
  const isGroup = conversation.isGroup;
  const isGroupAI = conversation._id === "guppshup_ai_bot";
  const isAI = conversation.isAI || isGroupAI;

  const title = isGroupAI
    ? "GuppShup AI 🤖"
    : isGroup
    ? conversation.groupName
    : (conversation.fullName || "").replace(/ \(AI\)$/, "");
  const avatarSrc = isGroup
    ? conversation.groupPic
    : conversation.profilePic;

  const isOnline = isAI || (!isGroup && onlineUsers.includes(conversation._id));

  const getStatusColorClass = () => {
    if (isAI) return "bg-purple-500 shadow-none";
    if (!isOnline) return "bg-slate-500 shadow-none";
    switch (conversation.status) {
      case "Active": return "status-active";
      case "Away": return "status-away";
      case "Do Not Disturb": return "status-dnd";
      default: return "status-active";
    }
  };

  const lastMsg = conversation.lastMessage || (isAI ? conversation.bio : null);
  const timeStr = conversation.lastMessageAt
    ? new Date(conversation.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <>
      <div
        tabIndex={0}
        className={`flex gap-3 items-center rounded-lg p-2.5 cursor-pointer focus:outline-none transition-all duration-200 hover:bg-[color:var(--panel-border)] hover:scale-[1.02] active:scale-[0.98] border-l-4 group/item relative
          ${isSelected ? "bg-purple-500/20 border-purple-500" : "border-transparent"}
        `}
        onClick={() => setSelectedConversation(conversation)}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <Avatar
            src={avatarSrc}
            name={title}
            className="w-11 h-11"
          />
          {isAI ? (
            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-black bg-purple-600 flex items-center justify-center text-[8px] text-white">
              <FaRobot />
            </span>
          ) : !isGroup ? (
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${getStatusColorClass()}`} />
          ) : (
            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-black bg-purple-600 flex items-center justify-center text-[8px] text-white">
              <FaUsers />
            </span>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex justify-between items-baseline">
            <div className="flex items-center gap-1 truncate">
              <p className="font-semibold text-sm text-[var(--text-main)] truncate">{title}</p>
              {isPinned && <FaThumbtack className="text-[10px] text-amber-400 transform -rotate-45" title="Pinned Chat" />}
            </div>
            <div className="flex items-center gap-2">
              {timeStr && (
                <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0">{timeStr}</span>
              )}
              {isAI ? (
                <span className="text-[9px] text-purple-300 font-semibold px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/30 flex items-center gap-1">
                  <FaRobot className="text-[8px]" /> AI Bot
                </span>
              ) : isGroup ? (
                <span className="text-[9px] text-purple-300 font-semibold px-1.5 py-0.5 rounded bg-purple-500/20">
                  Group
                </span>
              ) : isOnline ? (
                <span className="text-[10px] text-[var(--accent)] font-semibold px-1.5 py-0.5 rounded bg-[var(--accent)]/10">
                  online
                </span>
              ) : null}
            </div>
          </div>
          <p className={`text-xs truncate mt-0.5 ${lastMsg ? "text-[var(--text-muted)]" : "text-[var(--text-muted)] opacity-50"}`}>
            {lastMsg || (isAI ? "" : (isGroup ? `${conversation.participants?.length || 0} members` : "Hey there!"))}
          </p>
        </div>

        {/* Pin Hover Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onTogglePin) onTogglePin(conversation._id);
          }}
          className={`hidden group-hover/item:flex p-1 rounded hover:bg-white/20 transition-colors text-xs ${
            isPinned ? "text-amber-400" : "text-slate-400 hover:text-white"
          }`}
          title={isPinned ? "Unpin Chat" : "Pin Chat"}
        >
          <FaThumbtack />
        </button>
      </div>

      {!lastIdx && <div className="border-b border-white/5 my-1.5 mx-2" />}
    </>
  );
};

export default Conversation;
