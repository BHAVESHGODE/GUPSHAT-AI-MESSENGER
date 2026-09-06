import { useState, useRef, useEffect } from "react";
import { BsSend as BsSendIcon, BsEmojiSmile as BsEmojiIcon, BsPaperclip as BsPaperclipIcon, BsMic as BsMicIcon, BsTrash as BsTrashIcon } from "react-icons/bs";
import { FaTimes, FaAt, FaCommentDots } from "react-icons/fa";
import useSendMessage from "../../hooks/useSendMessage";
import useAI from "../../hooks/useAI";
import { useSocketContext } from "../../context/SocketContext";
import { useAuthContext } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import useConversation from "../../zustand/useConversation";
import Avatar from "../Avatar";
import toast from "react-hot-toast";

// Canonical persona config — MUST match backend aiCharacters.js,
// Message.jsx charMetaMap, and MessageContainer charactersList
// (prevents the "two Kabirs" phantom avatar glitch).
const characterAvatars = {
  kabir: { name: "Kabir", avatar: "/avatars/kabir.jpg" },
  tara: { name: "Martina", avatar: "/avatars/martina.jpg" },
  sid: { name: "Sid", avatar: "/avatars/sid.jpg" },
  maverick: { name: "Maverick", avatar: "/avatars/maverick.jpg" },
  ghalib: { name: "Ghalib", avatar: "/avatars/ghalib.jpg" },
  pippaa: { name: "Pippaa", avatar: "/avatars/pippaa_baddie.jpg" },
  // Legacy alias (old zafar persona) — maps to canonical Ghalib.
  zafar: { name: "Ghalib", avatar: "/avatars/ghalib.jpg" },
};

const personaStartersMap = {
  kabir: [
    "Having a rough day...",
    "Need some honest advice.",
    "Just wanted to talk to someone."
  ],
  sid: [
    "Roast my existence.",
    "Tell me a dark joke.",
    "Why is everything going wrong?"
  ],
  tara: [
    "Why are you so mysterious?",
    "Tease me.",
    "What are you up to tonight?"
  ],
  maverick: [
    "Why are you so full of yourself?",
    "Entertain me.",
    "Do you ever stop flirting?"
  ],
  ghalib: [
    "Kuch samajh nahi aa raha, bohot akela lag raha hai.",
    "Ghalib, koi achhi shayari sunao mood theek karne ke liye.",
    "Aaj din bohot thaka dene wala tha."
  ],
  pippaa: [
    "Roast me, I need a reality check.",
    "I had the worst day ever.",
    "Guess what just happened?!"
  ],
  zafar: [
    "Adaab Ghalib, koi shayari ho jaaye?",
    "Zindagi mein sukoon kahan milega?",
    "Aapki sabse pasandida gazal kaunsi hai?"
  ]
};

const MessageInput = ({ externalSelectedFile, clearExternalFile }) => {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [mentionQuery, setMentionQuery] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isAiTyping, setIsAiTyping] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const { loading: sending, sendMessage } = useSendMessage();
  const { askAI, loading: aiLoading } = useAI();
  const { socket } = useSocketContext();
  const { authUser } = useAuthContext();
  const { theme } = useTheme();
  const isMidnight = theme === "midnight" || theme === "classic" || theme === "midnight-cozy";
  const isLilac = theme === "lilac" || theme === "cyberpunk" || theme === "lilac-lavender";
  const isSapphire = theme === "sapphire" || theme === "dark-sapphire";
  const isForest = theme === "forest" || theme === "sage-forest";

  // Input Area (Bottom Bar) — theme-tinted glass + high-contrast text
  const formWrapperClass = isMidnight
    ? "bg-[#0B0F19] border-t border-white/5"
    : isLilac
    ? "bg-[#130b1c] border-t border-purple-400/10"
    : isSapphire
    ? "bg-[#0B1320] border-t border-blue-400/10"
    : isForest
    ? "bg-[#0A1711] border-t border-emerald-400/10"
    : "border-t border-[var(--panel-border)] bg-transparent";

  const inputFieldClass = isMidnight
    ? "bg-[#1A2235] border border-white/10 text-white placeholder-gray-500 focus:ring-amber-500/50"
    : isLilac
    ? "bg-[#261735] border border-purple-500/20 text-white placeholder-purple-300/50 focus:ring-fuchsia-500/50"
    : isSapphire
    ? "bg-[#131F33] border border-blue-500/20 text-white placeholder-blue-300/50 focus:ring-cyan-500/50"
    : isForest
    ? "bg-[#10241A] border border-emerald-500/20 text-white placeholder-emerald-300/50 focus:ring-teal-500/50"
    : "bg-[var(--input-bg)] border border-[var(--panel-border)] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:ring-[var(--accent)]";
  const {
    selectedConversation,
    messages,
    setMessages,
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    updateMessageInState,
    activeCharacterId,
  } = useConversation();

  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const pickerRef = useRef(null);
  const fileInputRef = useRef(null);

  const emojis = [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
    "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
    "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
    "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
    "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬",
    "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗",
    "🤔", "🫣", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🫠",
    "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪",
    "😵", "😵‍💫", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕",
    "😈", "👿", "👹", "👺", "💀", "☠️", "👻", "👽", "👾", "🤖",
    "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾", "👋",
    "👍", "👎", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "❤️", "🔥", "✨"
  ];

  useEffect(() => {
    if (externalSelectedFile) {
      setSelectedFile(externalSelectedFile);
    }
  }, [externalSelectedFile]);

  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.message || "");
    }
  }, [editingMessage]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size exceeds 50MB limit");
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (clearExternalFile) clearExternalFile();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setMessage(val);

    if (selectedConversation?.isGroup) {
      const lastWord = val.split(/\s+/).pop();
      if (lastWord && lastWord.startsWith("@")) {
        setMentionQuery(lastWord.slice(1).toLowerCase());
      } else {
        setMentionQuery(null);
      }
    } else {
      setMentionQuery(null);
    }

    if (!socket || !selectedConversation) return;

    if (!isTypingRef.current && val.trim().length > 0) {
      isTypingRef.current = true;
      socket.emit("typing", { receiverId: selectedConversation._id });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        socket.emit("stopTyping", { receiverId: selectedConversation._id });
      }
    }, 2000);
  };

  const selectMention = (username) => {
    const words = message.split(/\s+/);
    words.pop();
    const newMsg = [...words, `@${username} `].join(" ");
    setMessage(newMsg);
    setMentionQuery(null);
  };

  const handleStarterClick = async (starterText) => {
    setMessage(starterText);
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Audio recording is not supported in this browser environment");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast.error("Microphone permission denied. Please allow microphone access in browser settings.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        toast.error("No microphone hardware detected on your device.");
      } else {
        toast.error("Could not access microphone: " + (err.message || "Unknown error"));
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  const stopAndSendRecording = async () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const audioFile = new File([audioBlob], `Voice_Note_${Date.now()}.webm`, { type: "audio/webm" });

      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      clearInterval(recordingTimerRef.current);
      setIsRecording(false);
      setRecordingTime(0);

      await uploadAndSendMessage(audioFile, "Voice Note");
    };

    mediaRecorderRef.current.stop();
  };

  const uploadAndSendMessage = async (fileToUpload, customText = "") => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", fileToUpload);

      const res = await fetch("/api/messages/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const payload = {
        message: customText || message || "",
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        fileName: data.fileName,
        fileSize: data.fileSize,
        replyTo: replyingTo?._id || null,
      };

      await sendMessage(payload);
      setSelectedFile(null);
      if (clearExternalFile) clearExternalFile();
      setReplyingTo(null);
      setMessage("");
    } catch (err) {
      toast.error("File upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingMessage) {
      if (!message.trim()) return;
      try {
        const res = await fetch(`/api/messages/edit/${editingMessage._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        updateMessageInState(data);
        setEditingMessage(null);
        setMessage("");
        toast.success("Message edited");
      } catch (err) {
        toast.error(err.message);
      }
      return;
    }

    if (selectedFile) {
      await uploadAndSendMessage(selectedFile, message);
      return;
    }

    if (!message.trim()) return;

    if (socket && selectedConversation && isTypingRef.current) {
      isTypingRef.current = false;
      clearTimeout(typingTimeoutRef.current);
      socket.emit("stopTyping", { receiverId: selectedConversation._id });
    }

    const currentMsgText = message.trim();
    const replyToId = replyingTo?._id || null;
    const optimisticId = `optimistic_${Date.now()}`;

    // 1-on-1 AI persona comes from the open conversation, NOT the Group sandbox pill.
    const isIndividualAIChat = Boolean(
      selectedConversation?.isAI && selectedConversation?._id !== "guppshup_ai_bot"
    );
    const effectiveCharacterId =
      (isIndividualAIChat && selectedConversation?.characterId) || activeCharacterId;

    // 1. Optimistic UI + Memory Fix: capture immediate state BEFORE fetch.
    // React state is async — do NOT send raw `messages` in the fetch body.
    // Must match Message.jsx render condition (senderId === authUser._id => fromMe).
    const newUserMsg = {
      _id: optimisticId,
      senderId: authUser._id,
      receiverId: selectedConversation._id,
      message: currentMsgText,
      text: currentMsgText,
      role: "user",
      sender: "ME",
      characterId: effectiveCharacterId,
      replyTo: replyToId,
      createdAt: new Date().toISOString(),
    };
    const updatedHistory = [...(messages || []), newUserMsg];
    setMessages(updatedHistory);
    setMessage("");
    setReplyingTo(null);
    setShowEmojiPicker(false);
    setMentionQuery(null);

    const isGroupAIChat = selectedConversation?._id === "guppshup_ai_bot" || currentMsgText.toLowerCase().startsWith("@ai");

    if (isGroupAIChat) {
      setIsAiTyping(true);
      try {
        const prompt = currentMsgText.replace(/^@ai\s*/i, "");
        const saved = await sendMessage(
          { message: currentMsgText, characterId: activeCharacterId },
          { optimisticId }
        );
        if (!saved) {
          throw new Error("Failed to send message");
        }

        const historyContext = updatedHistory.slice(-10).map((m) => ({
          role: m.senderId === authUser._id || m.senderId?._id === authUser._id ? "user" : "assistant",
          content: m.message || m.text || "",
          characterId: m.characterId,
        }));

        const aiResponses = await askAI(prompt || "Hey", activeCharacterId || "kabir", historyContext);
        if (!aiResponses) {
          throw new Error("Failed to get AI response");
        }
        // Strictly append ONLY — never overwrite state (no setMessages(data.history)).
        if (aiResponses && aiResponses.length > 0) {
          const activeCharacter = characterAvatars[activeCharacterId] || characterAvatars.kabir;
          const uniqueResponses = [...new Set(aiResponses.map((res) => (res || "").trim()).filter(Boolean))];

          const aiBubbles = uniqueResponses.map((text, i) => ({
            _id: `ai-${Date.now()}-${i}`,
            text: text,
            message: text,
            role: "assistant",
              characterId: activeCharacterId,
              senderName: activeCharacter.name,
            avatar: activeCharacter.avatar,
            receiverId: authUser._id,
            createdAt: new Date().toISOString(),
          }));

          setMessages((prev) => {
            // Filter out duplicates, but KEEP all previous user messages intact.
            const filteredBubbles = aiBubbles.filter(
              (newMsg) => !prev.some((existingMsg) => (existingMsg.text === newMsg.text || existingMsg.message === newMsg.text) && existingMsg.role === "assistant")
            );
            return [...prev, ...filteredBubbles]; // Append ONLY
          });
        }
      } catch (error) {
        console.error("Group AI Chat Error:", error);
        setMessages((prev) => prev.filter((msg) => msg._id !== newUserMsg._id));
        toast.error(error.message || "Failed to get AI response");
      } finally {
        setIsAiTyping(false);
      }
    } else if (isIndividualAIChat) {
      // Stateful 1-on-1 AI: backend persists user msg, generates Gemini reply,
      // returns ONLY the AI message + emits the same msg on socket.
      // Do NOT pass optimisticId — it would replace the user bubble with the AI reply.
      setIsAiTyping(true);
      try {
        const aiReply = await sendMessage({ message: currentMsgText, replyTo: replyToId });
        if (!aiReply) {
          setMessages((prev) => prev.filter((m) => m._id !== optimisticId));
          throw new Error("Failed to send message");
        }
        // Optimistic user bubble stays; AI reply appended once via sendMessage,
        // socket duplicate suppressed by ID dedup in useListenMessages.
      } catch (err) {
        console.error("SendMessage error:", err);
        setMessages((prev) => prev.filter((m) => m._id !== optimisticId));
        if (err.message) toast.error(err.message);
      } finally {
        setIsAiTyping(false);
      }
    } else {
      // Human / Group Chat: backend echoes the saved user message, so reconcile IDs.
      try {
        const saved = await sendMessage(
          { message: currentMsgText, replyTo: replyToId },
          { optimisticId }
        );
        if (!saved) {
          setMessages((prev) => prev.filter((m) => m._id !== optimisticId));
        }
      } catch (err) {
        console.error("SendMessage error:", err);
        setMessages((prev) => prev.filter((m) => m._id !== optimisticId));
      }
    }
  };

  const formatRecordingTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const matchingMentionParticipants = selectedConversation?.isGroup && mentionQuery !== null
    ? (selectedConversation.participants || []).filter((p) =>
        (p.username || "").toLowerCase().includes(mentionQuery) ||
        (p.fullName || "").toLowerCase().includes(mentionQuery)
      )
    : [];

  const starterCharacterId = selectedConversation?.characterId || activeCharacterId;
  const activeStarters = personaStartersMap[starterCharacterId] || personaStartersMap.kabir;
  const isAI = selectedConversation?.isAI;
  const showPersonaStarters = isAI && (messages?.length <= 2) && !isRecording && !selectedFile;

  const loading = sending || aiLoading || uploading;

  return (
    <form className={`px-4 py-3 relative backdrop-blur-md ${formWrapperClass}`} onSubmit={handleSubmit}>

      {/* Contextual Persona Starter Chips */}
      {showPersonaStarters && (
        <div className="mb-2 flex items-center gap-2 overflow-x-auto py-1 animate-fade-in select-none">
          <span className="text-[10px] text-[var(--accent)] font-semibold flex items-center gap-1 flex-shrink-0">
            <FaCommentDots /> Starters:
          </span>
          {activeStarters.map((starter, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleStarterClick(starter)}
              className="px-3 py-1 rounded-full bg-[var(--accent)]/15 hover:bg-[var(--accent)]/30 border border-[var(--accent)]/30 text-[var(--text-main)] text-xs font-medium transition-all hover:scale-105 flex-shrink-0"
            >
              {starter}
            </button>
          ))}
        </div>
      )}

      {selectedConversation?.isGroup && mentionQuery !== null && matchingMentionParticipants.length > 0 && (
        <div className="absolute bottom-16 left-12 w-64 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-xl shadow-2xl p-1 z-40 max-h-40 overflow-y-auto backdrop-blur-md">
          <div className="text-[10px] text-[var(--text-muted)] px-2 py-1 font-semibold uppercase flex items-center gap-1 border-b border-[var(--panel-border)] mb-1">
            <FaAt className="text-[var(--accent)]" /> Mention Member
          </div>
          {matchingMentionParticipants.map((p) => (
            <div
              key={p._id || p}
              onClick={() => selectMention(p.username || p.fullName)}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/10 rounded-lg cursor-pointer text-xs"
            >
              <Avatar src={p.profilePic} name={p.fullName || "User"} className="w-6 h-6" />
              <div className="flex flex-col truncate">
                <span className="font-semibold text-[var(--text-main)] truncate">{p.fullName}</span>
                <span className="text-[10px] text-[var(--text-muted)]">@{p.username}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {replyingTo && (
        <div className="mb-2 p-2 bg-[var(--accent)]/15 border-l-4 border-[var(--accent)] rounded-lg flex items-center justify-between animate-fade-in text-xs">
          <div className="flex flex-col truncate pr-2">
            <span className="font-semibold text-[var(--accent)]">Replying to {replyingTo.senderId === authUser._id ? "Yourself" : "Partner"}</span>
            <span className="text-[var(--text-main)] truncate">{replyingTo.message || replyingTo.fileName || "Media Attachment"}</span>
          </div>
          <button type="button" onClick={() => setReplyingTo(null)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1">
            <FaTimes />
          </button>
        </div>
      )}

      {editingMessage && (
        <div className="mb-2 p-2 bg-amber-500/15 border-l-4 border-amber-500 rounded-lg flex items-center justify-between animate-fade-in text-xs">
          <div className="flex flex-col truncate pr-2">
            <span className="font-semibold text-amber-500">Editing Message</span>
            <span className="text-[var(--text-main)] truncate">{editingMessage.message}</span>
          </div>
          <button type="button" onClick={() => { setEditingMessage(null); setMessage(""); }} className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1">
            <FaTimes />
          </button>
        </div>
      )}

      {isAiTyping && (
        <div className="flex gap-3 animate-pulse mt-2">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 text-gray-400 rounded-2xl rounded-tl-sm px-4 py-2 text-sm">
            Typing...
          </div>
        </div>
      )}

      {selectedFile && (
        <div className="mb-2 p-2.5 bg-[var(--input-bg)] border border-[var(--panel-border)] rounded-xl flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-lg">📁</span>
            <div className="flex flex-col truncate">
              <span className="font-medium text-[var(--text-main)] truncate">{selectedFile.name}</span>
              <span className="text-[10px] text-[var(--text-muted)]">{(selectedFile.size / 1024).toFixed(1)} KB</span>
            </div>
          </div>
          <button type="button" onClick={removeSelectedFile} className="p-1.5 rounded-full hover:bg-black/10 text-[var(--text-muted)] hover:text-red-500">
            <FaTimes />
          </button>
        </div>
      )}

      {isRecording ? (
        <div className="w-full flex items-center justify-between bg-red-950/40 border border-red-500/30 rounded-full px-4 py-2 text-xs text-white animate-pulse">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
            <span className="font-semibold tracking-wider text-red-400">Recording Voice Note ({formatRecordingTime(recordingTime)})</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={cancelRecording} className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400" title="Cancel">
              <BsTrashIcon className="text-sm" />
            </button>
            <button type="button" onClick={stopAndSendRecording} className="px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-medium shadow-lg" title="Send Voice Note">
              Send Note
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full flex items-center gap-2 relative">
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 transition-colors flex-shrink-0"
            title="Attach File"
          >
            <BsPaperclipIcon className="text-lg" />
          </button>

          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 transition-colors flex-shrink-0"
            title="Add Emoji"
          >
            <BsEmojiIcon className="text-lg" />
          </button>

          {showEmojiPicker && (
            <div
              ref={pickerRef}
              className="absolute bottom-14 left-0 w-64 h-48 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-xl shadow-2xl p-2 overflow-y-auto z-40 grid grid-cols-6 gap-1 select-none backdrop-blur-md"
            >
              {emojis.map((emoji, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMessage((prev) => prev + emoji)}
                  className="text-lg hover:bg-black/10 p-1 rounded transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              maxLength={4000}
              className={`w-full text-sm py-2 pl-4 pr-12 rounded-full backdrop-blur-md focus:outline-none focus:ring-1 transition-all ${inputFieldClass}`}
              placeholder={
                editingMessage
                  ? "Edit your message..."
                  : selectedFile
                  ? "Add a caption..."
                  : selectedConversation?.isAI
                  ? `Chat with ${characterAvatars[selectedConversation?.characterId || activeCharacterId]?.name || "AI"}...`
                  : selectedConversation?.isGroup
                  ? "Type a message or @mention..."
                  : "Send a message..."
              }
              value={message}
              onChange={handleInputChange}
            />

            {!message.trim() && !selectedFile && !editingMessage ? (
              <button
                type="button"
                onClick={startRecording}
                className="absolute right-3.5 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                title="Record Voice Note"
              >
                <BsMicIcon className="text-sm" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="absolute right-3.5 text-[var(--accent)] hover:opacity-80 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <BsSendIcon className="text-sm" />
                )}
              </button>
            )}
          </div>

        </div>
      )}
    </form>
  );
};

export default MessageInput;
