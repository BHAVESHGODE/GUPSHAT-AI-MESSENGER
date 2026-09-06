import { useEffect, useState } from "react";
import useConversation from "../../zustand/useConversation";
import MessageInput from "./MessageInput";
import Messages from "./Messages";
import MediaLightbox from "./MediaLightbox";
import GroupInfoModal from "./GroupInfoModal";
import ChatAnalyticsModal from "./ChatAnalyticsModal";
import CallHistoryModal from "./CallHistoryModal";
import AIFeedbackModal from "./AIFeedbackModal";
import useAI from "../../hooks/useAI";
import { TiMessages } from "react-icons/ti";
import { useAuthContext } from "../../context/AuthContext";
import { useSocketContext } from "../../context/SocketContext";
import { useTheme } from "../../context/ThemeContext";
import { useCall } from "../../context/CallContext";
import { FaPhone, FaVideo, FaSearch, FaTimes, FaCloudUploadAlt, FaInfoCircle, FaUsers, FaBan, FaUnlock, FaClock, FaDownload, FaChartBar, FaRobot, FaHistory, FaBrain } from "react-icons/fa";
import Avatar from "../Avatar";
import toast from "react-hot-toast";

const charactersList = [
  { id: "kabir", name: "Kabir", tagline: "Your real one. Raw honesty, grounded perspective, zero fake energy.", avatar: "/avatars/kabir.jpg", greeting: "Good to see you. How's your day treating you so far?" },
  { id: "tara", name: "Martina", tagline: "Dark Feminine Baddie & Sultry Menace. Play with fire at your own risk.", avatar: "/avatars/martina.jpg", greeting: "Look who finally showed up... You kept me waiting." },
  { id: "sid", name: "Sid", tagline: "Cynical Menace & Dark Humor Specialist. Do not engage.", avatar: "/avatars/sid.jpg", greeting: "Oh, you're still alive. Tragic. What do you want?" },
  { id: "maverick", name: "Maverick", tagline: "Perceptive, effortlessly cool, and dangerously charming. He reads the room, then owns it.", avatar: "/avatars/maverick.jpg", greeting: "I was wondering when you'd drop by. What's on your mind?" },
  { id: "ghalib", name: "Ghalib", tagline: "Universal Poet & Empathetic Soul. Deep thoughts and soulful shayari.", avatar: "/avatars/ghalib.jpg", greeting: "Aaiye, baithiye. Zindagi ki is bheed mein thoda sukoon yahan bhi baant lete hain. Kahiye, kya chal raha hai zehan mein?" },
  { id: "pippaa", name: "Pippaa", tagline: "Chaotic companion. Will roast you, then aggressively defend your honor.", avatar: "/avatars/pippaa_baddie.jpg", greeting: "yooo! kya scene hai aaj ka? please tell me you brought some drama to entertain me." },
];

const MessageContainer = () => {
  const {
    selectedConversation,
    setSelectedConversation,
    messages,
    setMessages,
    messageSearchQuery,
    setMessageSearchQuery,
    activeCharacterId,
    setActiveCharacterId,
  } = useConversation();
  const { socket, onlineUsers } = useSocketContext();
  const { initiateCall } = useCall();
  const { toggleBlockUser } = useAI();
  const { authUser } = useAuthContext();
  const { theme } = useTheme();
  const isMidnight = theme === "midnight" || theme === "classic" || theme === "midnight-cozy";
  const isLilac = theme === "lilac" || theme === "cyberpunk" || theme === "lilac-lavender";
  const isSapphire = theme === "sapphire" || theme === "dark-sapphire";
  const isForest = theme === "forest" || theme === "sage-forest";
  const isThemed = isMidnight || isLilac || isSapphire || isForest;

  // Global Base & Backgrounds (The Canvas) — rich deep tones per theme
  const chatBgClass = isMidnight
    ? "bg-[#0B0F19]"
    : isLilac
    ? "bg-[#130b1c]"
    : isSapphire
    ? "bg-[#0B1320]"
    : isForest
    ? "bg-[#0A1711]"
    : "bg-transparent";

  const pillsContainerClass = isMidnight
    ? "bg-white/5 backdrop-blur-md border border-white/10"
    : isLilac
    ? "bg-purple-950/30 backdrop-blur-md border border-purple-400/20"
    : isSapphire
    ? "bg-blue-950/30 backdrop-blur-md border border-blue-400/20"
    : isForest
    ? "bg-emerald-950/30 backdrop-blur-md border border-emerald-400/20"
    : "bg-gray-100/50 backdrop-blur-md border border-gray-200";

  const getPillClass = (isActive) => {
    const baseTypography = "font-['Outfit',sans-serif] tracking-wide antialiased rounded-full px-4 py-1.5 text-[13px] transition-all duration-200";
    if (isActive && isMidnight)
      return `${baseTypography} bg-white/15 border border-white/30 text-white font-semibold shadow-[0_0_12px_rgba(255,255,255,0.15)]`;
    if (isActive && isLilac)
      return `${baseTypography} bg-purple-500/25 border border-purple-400/40 text-purple-100 font-semibold shadow-[0_0_12px_rgba(168,85,247,0.3)]`;
    if (isActive && isSapphire)
      return `${baseTypography} bg-blue-500/25 border border-blue-400/40 text-blue-100 font-semibold shadow-[0_0_12px_rgba(59,130,246,0.3)]`;
    if (isActive && isForest)
      return `${baseTypography} bg-emerald-500/25 border border-emerald-400/40 text-emerald-100 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.3)]`;
    if (isActive)
      return `${baseTypography} bg-gray-900 text-white font-semibold shadow-md transform scale-[1.02] border border-gray-700`;
    // Inactive states
    if (isThemed)
      return `${baseTypography} text-white/60 hover:text-white hover:bg-white/10 font-medium`;
    return `${baseTypography} text-gray-500 hover:text-gray-900 hover:bg-gray-200/60 font-medium`;
  };

  const [isTyping, setIsTyping] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [droppedFile, setDroppedFile] = useState(null);
  const [lightboxFile, setLightboxFile] = useState(null);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isCallHistoryOpen, setIsCallHistoryOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [disappearingTimer, setDisappearingTimer] = useState("off");
  const [showTimerMenu, setShowTimerMenu] = useState(false);

  const isGroup = selectedConversation?.isGroup;
  const isGroupAI = selectedConversation?._id === "guppshup_ai_bot";
  const isIndividualAI = Boolean(selectedConversation?.isIndividualAI || (selectedConversation?.isAI && !isGroupAI));
  const isAI = isGroupAI || isIndividualAI;

  const isAdmin = Boolean(
    authUser &&
    ((authUser.email || "").toLowerCase() === "bhaveshgode676@gmail.com" ||
     (authUser.username || "").toLowerCase() === "bhaveshgode676" ||
     (authUser.username || "").toLowerCase() === "bhavesh_admin")
  );

  useEffect(() => {
    if (isIndividualAI && selectedConversation?.characterId) {
      setActiveCharacterId(selectedConversation.characterId);
    }
  }, [isIndividualAI, selectedConversation, setActiveCharacterId]);

  const currentCharacter = isGroupAI
    ? (charactersList.find((c) => c.id === activeCharacterId) || charactersList[0])
    : isIndividualAI
    ? (charactersList.find((c) => c.id === selectedConversation?.characterId) || charactersList[0])
    : null;

  const title = isGroupAI
    ? currentCharacter.name
    : isGroup
    ? selectedConversation.groupName
    : selectedConversation?.fullName;

  const avatarSrc = isGroupAI
    ? currentCharacter.avatar
    : isGroup
    ? selectedConversation.groupPic
    : selectedConversation?.profilePic;

  const isOnline = isAI || (!isGroup && selectedConversation ? onlineUsers.includes(selectedConversation._id) : false);

  const activeCharacter = currentCharacter || charactersList[0];
  const wipeTargetId = isGroupAI
    ? activeCharacterId
    : isIndividualAI
    ? selectedConversation?.characterId || activeCharacterId
    : null;

  const [isWiping, setIsWiping] = useState(false);
  const [wipeArmed, setWipeArmed] = useState(false);

  // Reset the armed state whenever the chat or persona changes
  useEffect(() => {
    setWipeArmed(false);
  }, [selectedConversation?._id, activeCharacterId]);

  const handleMemoryWipe = async () => {
    if (isWiping) return;
    if (!isAI) {
      toast.error("Memory wipe is only available in AI chats");
      return;
    }
    if (!wipeTargetId) {
      toast.error("No AI character selected");
      return;
    }
    // Two-click inline confirm (no window.confirm — blocked in sandboxed iframes).
    if (!wipeArmed) {
      setWipeArmed(true);
      toast(`Click wipe again to confirm erasing ${activeCharacter.name}'s memory`, { icon: "⚠️" });
      setTimeout(() => setWipeArmed(false), 5000);
      return;
    }
    setWipeArmed(false);

    // Optimistic UI clear
    const previousMessages = useConversation.getState().messages;
    setMessages([]);
    setIsWiping(true);

    try {
      const res = await fetch(`/api/messages/clear/${wipeTargetId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error || "Failed to wipe memory");

      // Re-sync with server so UI is guaranteed to match DB (not just optimistic).
      if (isGroupAI) {
        setMessages([
          {
            _id: "ai_greeting_" + activeCharacterId,
            senderId: {
              _id: "guppshup_ai_bot",
              fullName: activeCharacter.name,
              username: activeCharacterId,
              profilePic: activeCharacter.avatar,
            },
            characterId: activeCharacterId,
            receiverId: authUser?._id,
            message: activeCharacter.greeting,
            createdAt: new Date().toISOString(),
          },
        ]);
      } else if (selectedConversation?._id) {
        const re = await fetch(`/api/messages/${selectedConversation._id}`);
        const fresh = await re.json().catch(() => null);
        setMessages(Array.isArray(fresh) ? fresh : []);
      }
      toast.success("Memory Wiped. Start fresh!");
    } catch (error) {
      console.error("Failed to wipe memory:", error);
      setMessages(previousMessages);
      toast.error(error.message || "Failed to wipe memory");
    } finally {
      setIsWiping(false);
    }
  };

  // Proactive Greetings (Auto-Initiate ONLY on empty chat in Group AI Chat mode)
  useEffect(() => {
    if (!isGroupAI || !authUser) return;

    const currentPersona = charactersList.find((c) => c.id === activeCharacterId) || charactersList[0];
    const existingMsgs = useConversation.getState().messages;

    if (existingMsgs.length === 0 || (existingMsgs.length === 1 && String(existingMsgs[0]._id).startsWith("ai_greeting_"))) {
      const greetingDoc = {
        _id: "ai_greeting_" + activeCharacterId,
        senderId: {
          _id: "guppshup_ai_bot",
          fullName: currentPersona.name,
          username: activeCharacterId,
          profilePic: currentPersona.avatar,
        },
        characterId: activeCharacterId,
        receiverId: authUser._id,
        message: currentPersona.greeting,
        createdAt: new Date().toISOString(),
      };
      useConversation.getState().setMessages([greetingDoc]);
    }
  }, [isGroupAI, activeCharacterId, authUser]);

  useEffect(() => {
    if (!socket || !selectedConversation) return;

    const handleTyping = ({ senderId }) => {
      if (senderId === selectedConversation._id) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = ({ senderId }) => {
      if (senderId === selectedConversation._id) {
        setIsTyping(false);
      }
    };

    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    setIsTyping(false);
    setShowSearch(false);
    setMessageSearchQuery("");
    setDroppedFile(null);
    setLightboxFile(null);
    setIsGroupInfoOpen(false);
    setIsAnalyticsOpen(false);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [socket, selectedConversation, setMessageSearchQuery]);



  const handleToggleBlock = async () => {
    if (!selectedConversation || isGroup || isAI) return;
    const res = await toggleBlockUser(selectedConversation._id);
    if (res) {
      setIsBlocked(res.isBlocked);
    }
  };

  const exportChatHistory = () => {
    if (!messages || messages.length === 0) {
      toast.error("No messages to export");
      return;
    }

    const lines = [`=== GuppShup Chat Transcript: ${title} ===`, `Exported on: ${new Date().toLocaleString()}`, "--------------------------------------------------\n"];

    messages.forEach((m) => {
      const timeStr = new Date(m.createdAt).toLocaleString();
      const sender = m.senderId === authUser._id || m.senderId?._id === authUser._id ? authUser.fullName : m.senderId?.fullName || title;
      const content = m.message || (m.fileUrl ? `[Attachment: ${m.fileName || m.fileType}]` : "");
      lines.push(`[${timeStr}] ${sender}: ${content}`);
    });

    const textBlob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(textBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `GuppShup_Chat_${(title || "history").replace(/\s+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Chat transcript exported!");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedConversation && !isDraggingFile) {
      setIsDraggingFile(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDraggingFile(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setDroppedFile(file);
    }
  };

  const handleCloseSearch = () => {
    setShowSearch(false);
    setMessageSearchQuery("");
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 flex flex-col h-full overflow-hidden relative ${chatBgClass}`}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingFile && (
        <div className="absolute inset-0 z-40 bg-[var(--panel-bg)] backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed border-[var(--accent)] m-2 rounded-2xl animate-fade-in text-[var(--text-main)] pointer-events-none">
          <FaCloudUploadAlt className="text-6xl text-[var(--accent)] animate-bounce mb-2" />
          <h3 className="text-2xl font-bold">Drop File to Send</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">Images, Videos, Audio notes, or Documents up to 50MB</p>
        </div>
      )}

      {!selectedConversation ? (
        <NoChatSelected />
      ) : (
        <>
          {/* Header — relative z-50 with no overflow-hidden so pill tooltips escape */}
          <div className="relative z-50 overflow-visible bg-transparent border-b border-[var(--panel-border)] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="relative flex-shrink-0 cursor-pointer" onClick={() => isGroup && setIsGroupInfoOpen(true)}>
                <Avatar
                  src={avatarSrc}
                  name={title}
                  className="w-10 h-10"
                />
                {isAI ? (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border border-black bg-purple-600 flex items-center justify-center text-[7px] text-white">
                    <FaRobot />
                  </span>
                ) : !isGroup ? (
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-black ${isOnline ? "bg-green-500" : "bg-slate-500"}`} />
                ) : (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border border-black bg-purple-600 flex items-center justify-center text-[7px] text-white">
                    <FaUsers />
                  </span>
                )}
              </div>
              <div className="flex flex-col truncate cursor-pointer" onClick={() => isGroup && setIsGroupInfoOpen(true)}>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-[var(--text-main)] truncate">{title}</span>
                  {isGroup ? (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--accent)]/20 text-[var(--text-main)] font-semibold border border-[var(--accent)]/30">
                      Group
                    </span>
                  ) : isAI ? (
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full border border-white/20">AI</span>
                  ) : null}
                  {isAI && (
                    <button
                      onClick={handleMemoryWipe}
                      disabled={isWiping}
                      title={wipeArmed ? `Click again to confirm wiping ${activeCharacter.name}` : "Wipe AI Memory"}
                      className={`p-2 rounded-full border transition-all duration-300 group disabled:opacity-50 disabled:pointer-events-none ${
                        wipeArmed
                          ? "bg-red-500/30 border-red-500/50 text-red-300 animate-pulse"
                          : "bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border-transparent hover:border-red-500/30"
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  )}
                </div>
                {isTyping ? (
                  <span className="text-[10px] text-[var(--accent)] font-semibold animate-pulse">typing...</span>
                ) : (
                  <span className="text-[10px] text-[var(--text-muted)] truncate">
                    {isGroup
                      ? `${selectedConversation.participants?.length || 0} members • Click for info`
                      : isAI
                      ? `Active Persona: ${currentCharacter.name}`
                      : isOnline ? "Online" : "Offline"}
                  </span>
                )}
              </div>
            </div>

            {/* AI Character Switcher Pills in Header (Group AI Sandbox Only) */}
            {isGroupAI && (
              <div className={`relative overflow-visible flex space-x-1 rounded-full p-1 shadow-inner mx-2 select-none ${pillsContainerClass}`}>
                {charactersList.map((c) => (
                  <div key={c.id} className="relative group">
                    <button
                      onClick={() => {
                        setActiveCharacterId(c.id);
                        toast.success(`Switched AI Persona to ${c.name}`);
                      }}
                      className={getPillClass(activeCharacterId === c.id)}
                    >
                      {c.name}
                    </button>
                    <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-max max-w-[200px] px-3 py-2 text-xs text-center text-white bg-gray-900/95 backdrop-blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[9999] shadow-2xl whitespace-normal break-words shadow-black/50 border border-white/10">
                      {c.tagline}
                      {/* Small triangle pointer pointing up to the pill */}
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900/95 rotate-45 border-t border-l border-white/10"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Header Actions */}
            <div className="flex items-center gap-2 text-[color:var(--text-main)] relative">
              
              {isAI && isAdmin && (
                <button
                  onClick={() => setIsFeedbackModalOpen(true)}
                  className="px-2.5 py-1 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-400/30 transition-all flex items-center gap-1.5 text-xs shadow-sm"
                  title="RLHF Preference Dataset & Fine-Tuning Pipeline (Admin Only)"
                >
                  <FaBrain className="text-xs text-purple-400" />
                  <span className="hidden sm:inline text-[11px] font-semibold">RLHF Dataset</span>
                </button>
              )}

              <button
                onClick={() => setIsAnalyticsOpen(true)}
                className="p-2 rounded-full hover:bg-black/5 text-[var(--accent)] transition-colors"
                title="Chat Analytics"
              >
                <FaChartBar className="text-sm" />
              </button>

              <button
                onClick={exportChatHistory}
                className="p-2 rounded-full hover:bg-black/5 text-[color:var(--text-main)] transition-colors"
                title="Export Chat History (.TXT)"
              >
                <FaDownload className="text-sm" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowTimerMenu(!showTimerMenu)}
                  className={`p-2 rounded-full hover:bg-black/5 transition-colors ${disappearingTimer !== "off" ? "text-amber-500" : "text-[color:var(--text-main)]"}`}
                  title={`Disappearing Messages: ${disappearingTimer}`}
                >
                  <FaClock className="text-sm" />
                </button>
                {showTimerMenu && (
                  <div className="absolute right-0 top-10 w-40 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-xl shadow-2xl p-1.5 z-40 text-xs backdrop-blur-md">
                    <span className="text-[10px] font-semibold text-[var(--text-muted)] px-2 py-1 block border-b border-[var(--panel-border)] mb-1">Disappearing Timer</span>
                    {["off", "5m", "1h", "24h"].map((t) => (
                      <button
                        key={t}
                        onClick={() => { setDisappearingTimer(t); setShowTimerMenu(false); }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between hover:bg-black/10 ${disappearingTimer === t ? "text-[var(--accent)] font-bold" : "text-[var(--text-main)]"}`}
                      >
                        <span>{t === "off" ? "Off" : t === "5m" ? "5 Minutes" : t === "1h" ? "1 Hour" : "24 Hours"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!isGroup && !isAI && (
                <button
                  onClick={handleToggleBlock}
                  className={`p-2 rounded-full hover:bg-black/5 transition-colors ${isBlocked ? "text-red-500" : "text-[color:var(--text-main)] hover:text-red-400"}`}
                  title={isBlocked ? "Unblock User" : "Block User"}
                >
                  {isBlocked ? <FaUnlock className="text-sm" /> : <FaBan className="text-sm" />}
                </button>
              )}

              {isGroup && (
                <button
                  onClick={() => setIsGroupInfoOpen(true)}
                  className="p-2 rounded-full hover:bg-black/5 text-[var(--accent)] transition-colors"
                  title="Group Details"
                >
                  <FaInfoCircle className="text-sm" />
                </button>
              )}
              
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={`p-2 rounded-full hover:bg-black/5 transition-colors ${showSearch ? "text-[var(--accent)]" : "text-[color:var(--text-main)]"}`}
                title="Search Messages"
              >
                <FaSearch className="text-sm" />
              </button>

              {!isGroup && !isAI && (
                <>
                  <button
                    onClick={() => initiateCall(selectedConversation, "audio")}
                    className="p-2 rounded-full hover:bg-black/5 text-green-600 transition-colors"
                    title="Voice Call"
                  >
                    <FaPhone className="text-sm" />
                  </button>
                  <button
                    onClick={() => initiateCall(selectedConversation, "video")}
                    className="p-2 rounded-full hover:bg-black/5 text-purple-600 transition-colors"
                    title="Video Call"
                  >
                    <FaVideo className="text-sm" />
                  </button>
                  <button
                    onClick={() => setIsCallHistoryOpen(true)}
                    className="p-2 rounded-full hover:bg-black/5 text-amber-500 transition-colors"
                    title="Call History"
                  >
                    <FaHistory className="text-sm" />
                  </button>
                </>
              )}
            </div>
          </div>

          {disappearingTimer !== "off" && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 flex items-center justify-between text-[11px] text-amber-500 font-medium">
              <span className="flex items-center gap-1.5">
                <FaClock className="text-xs" /> Disappearing messages enabled ({disappearingTimer})
              </span>
              <button onClick={() => setDisappearingTimer("off")} className="hover:underline">
                Turn Off
              </button>
            </div>
          )}

          {showSearch && (
            <div className="bg-transparent border-b border-[var(--panel-border)] px-4 py-2 flex items-center justify-between animate-slide-down">
              <input
                type="text"
                placeholder="Search words in this chat..."
                className="flex-1 bg-transparent text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none"
                value={messageSearchQuery}
                onChange={(e) => setMessageSearchQuery(e.target.value)}
                autoFocus
              />
              <button onClick={handleCloseSearch} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <FaTimes className="text-xs" />
              </button>
            </div>
          )}

          <Messages
            isPartnerTyping={isTyping}
            onOpenLightbox={(file) => setLightboxFile(file)}
          />
          <MessageInput
            externalSelectedFile={droppedFile}
            clearExternalFile={() => setDroppedFile(null)}
          />

          {lightboxFile && (
            <MediaLightbox
              file={lightboxFile}
              onClose={() => setLightboxFile(null)}
            />
          )}

          {isGroup && isGroupInfoOpen && (
            <GroupInfoModal
              group={selectedConversation}
              isOpen={isGroupInfoOpen}
              onClose={() => setIsGroupInfoOpen(false)}
              onGroupUpdated={(updatedGroup) => setSelectedConversation(updatedGroup)}
            />
          )}

          {isAnalyticsOpen && (
            <ChatAnalyticsModal
              conversation={selectedConversation}
              messages={messages}
              isOpen={isAnalyticsOpen}
              onClose={() => setIsAnalyticsOpen(false)}
            />
          )}

          {isCallHistoryOpen && (
            <CallHistoryModal
              conversation={selectedConversation}
              isOpen={isCallHistoryOpen}
              onClose={() => setIsCallHistoryOpen(false)}
            />
          )}

          {isFeedbackModalOpen && (
            <AIFeedbackModal
              isOpen={isFeedbackModalOpen}
              onClose={() => setIsFeedbackModalOpen(false)}
              defaultCharacterId={isGroupAI ? activeCharacterId : selectedConversation?.characterId || activeCharacterId}
            />
          )}
        </>
      )}
    </div>
  );
};

export default MessageContainer;

const NoChatSelected = () => {
  const { authUser } = useAuthContext();
  return (
    <div className="flex items-center justify-center w-full h-full p-6">
      <div className="text-center flex flex-col items-center gap-4 max-w-md">
        <div className="w-16 h-16 rounded-full bg-[var(--accent)]/10 flex items-center justify-center border border-[var(--panel-border)] shadow-inner">
          <TiMessages className="text-4xl text-[var(--accent)]" />
        </div>
        <div className="space-y-1">
          <p className="serif-heading text-3xl font-normal text-[var(--text-main)]">Welcome, {authUser.fullName} 👋</p>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Select a contact, group, or GuppShup AI from the sidebar to start communicating securely.
          </p>
        </div>
      </div>
    </div>
  );
};