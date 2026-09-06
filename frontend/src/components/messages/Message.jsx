import { useState, useRef } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { extractTime } from "../../utils/extractTime";
import useConversation from "../../zustand/useConversation";
import useAI from "../../hooks/useAI";
import { 
  FaCheck, 
  FaCheckDouble, 
  FaPlay, 
  FaPause, 
  FaDownload, 
  FaReply, 
  FaPencilAlt, 
  FaTrash, 
  FaSmile, 
  FaGlobe, 
  FaFileAlt, 
  FaStar,
  FaThumbsUp,
  FaThumbsDown,
  FaRegThumbsUp,
  FaRegThumbsDown,
  FaCopy,
} from "react-icons/fa";
import Avatar from "../Avatar";
import toast from "react-hot-toast";

const charMetaMap = {
  kabir: { name: "Kabir", avatar: "/avatars/kabir.jpg" },
  tara: { name: "Martina", avatar: "/avatars/martina.jpg" },
  sid: { name: "Sid", avatar: "/avatars/sid.jpg" },
  maverick: { name: "Maverick", avatar: "/avatars/maverick.jpg" },
  ghalib: { name: "Ghalib", avatar: "/avatars/ghalib.jpg" },
  pippaa: { name: "Pippaa", avatar: "/avatars/pippaa_baddie.jpg" },
};

const Message = ({ message, onOpenLightbox }) => {
  const { authUser } = useAuthContext();
  const { messages, selectedConversation, setReplyingTo, setEditingMessage, updateMessageInState, removeMessageFromState, activeCharacterId } = useConversation();
  const { translateText, loading: translating } = useAI();
  
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState("0:00");
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  // Feature States
  const [showTranslateMenu, setShowTranslateMenu] = useState(false);
  const [translation, setTranslation] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [isStarred, setIsStarred] = useState(message.isStarred || false);

  // RLHF Feedback & Copy States
  const [feedbackRating, setFeedbackRating] = useState(message.feedbackRating || null);
  const [showFeedbackMenu, setShowFeedbackMenu] = useState(false);
  const [showNegativeTagView, setShowNegativeTagView] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const audioRef = useRef(null);
  const isGroup = selectedConversation?.isGroup;
  const rawSenderId = message.senderId?._id || message.senderId;
  const fromMe = rawSenderId === authUser._id;
  const formattedTime = extractTime(message.createdAt);
  const chatClassName = fromMe ? "chat-end" : "chat-start";

  const senderObj = typeof message.senderId === "object" ? message.senderId : null;
  const isAISender = rawSenderId === "guppshup_ai_bot" || senderObj?.username?.startsWith("ai_") || selectedConversation?.isAI;

  const currentPersona = charMetaMap[message.characterId || activeCharacterId || "kabir"] || charMetaMap.kabir;

  // Purge phantom avatar: for assistant bubbles ALWAYS use the canonical
  // frontend persona config (matches DB aiCharacters.js) — never a mixed DB prop.
  const isAssistantBubble = message.role === "assistant" || isAISender;

  const senderName = fromMe
    ? authUser.fullName
    : isAssistantBubble
    ? currentPersona.name
    : senderObj?.fullName
    ? senderObj.fullName
    : isGroup
    ? senderObj?.fullName || "Member"
    : selectedConversation?.fullName;

  const profilePic = fromMe
    ? authUser.profilePic
    : isAssistantBubble
    ? currentPersona.avatar
    : senderObj?.profilePic
    ? senderObj.profilePic
    : isGroup
    ? senderObj?.profilePic || ""
    : selectedConversation?.profilePic;

  const quickEmojis = ["👍", "❤️", "😂", "🔥", "😮", "😢"];
  const languages = [
    { name: "Spanish", code: "Spanish 🇪🇸" },
    { name: "French", code: "French 🇫🇷" },
    { name: "German", code: "German 🇩🇪" },
    { name: "Hindi", code: "Hindi 🇮🇳" },
    { name: "Japanese", code: "Japanese 🇯🇵" },
    { name: "Chinese", code: "Chinese 🇨🇳" },
    { name: "Arabic", code: "Arabic 🇸🇦" },
    { name: "Russian", code: "Russian 🇷🇺" },
  ];

  const { theme } = useTheme();
  const isMidnight = theme === "midnight" || theme === "classic" || theme === "midnight-cozy";
  const isLilac = theme === "lilac" || theme === "cyberpunk" || theme === "lilac-lavender";
  const isSapphire = theme === "sapphire" || theme === "dark-sapphire";
  const isForest = theme === "forest" || theme === "sage-forest";
  const isThemed = isMidnight || isLilac || isSapphire || isForest;

  // Dual Theme Overhaul: vibrant user bubbles MUST use dark text for contrast
  const userBubbleClass = isMidnight
    ? "bg-gradient-to-r from-amber-400 to-orange-500 text-gray-900 font-semibold rounded-2xl rounded-tr-sm px-4 py-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
    : isLilac
    ? "bg-gradient-to-r from-violet-400 to-fuchsia-400 text-gray-900 font-semibold rounded-2xl rounded-tr-sm px-4 py-2 shadow-[0_0_15px_rgba(167,139,250,0.2)]"
    : isSapphire
    ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-gray-900 font-semibold rounded-2xl rounded-tr-sm px-4 py-2 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
    : isForest
    ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-gray-900 font-semibold rounded-2xl rounded-tr-sm px-4 py-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
    : "bg-purple-600 text-white rounded-tr-none";

  const aiBubbleClass = isMidnight
    ? "bg-white/5 backdrop-blur-md border border-white/10 text-gray-100 rounded-2xl rounded-tl-sm px-4 py-2"
    : isLilac
    ? "bg-purple-900/20 backdrop-blur-md border border-purple-400/20 text-gray-100 rounded-2xl rounded-tl-sm px-4 py-2"
    : isSapphire
    ? "bg-blue-900/20 backdrop-blur-md border border-blue-400/20 text-gray-100 rounded-2xl rounded-tl-sm px-4 py-2"
    : isForest
    ? "bg-emerald-900/20 backdrop-blur-md border border-emerald-400/20 text-gray-100 rounded-2xl rounded-tl-sm px-4 py-2"
    : "bg-black/30 border border-white/10 text-white rounded-tl-none";

  const bubbleBgColor = fromMe ? userBubbleClass : aiBubbleClass;
  // Vibrant (bright gradient) user bubbles need dark inner elements
  const isVibrantUser = fromMe && isThemed;

  const shakeClass = message.shouldShake ? "shake" : "";

  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      const dur = audioRef.current.duration || 1;
      setAudioProgress((cur / dur) * 100);

      const mins = Math.floor(cur / 60);
      const secs = Math.floor(cur % 60);
      setAudioDuration(`${mins}:${secs.toString().padStart(2, "0")}`);
    }
  };

  const handleAudioEnded = () => {
    setIsPlayingAudio(false);
    setAudioProgress(0);
  };

  const handleAddReaction = async (emoji) => {
    try {
      setShowReactionPicker(false);
      const res = await fetch(`/api/messages/react/${message._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      updateMessageInState(data);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggleStar = async () => {
    try {
      const newStarred = !isStarred;
      setIsStarred(newStarred);
      const res = await fetch(`/api/messages/star/${message._id}`, {
        method: "PUT",
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      updateMessageInState(data);
      toast.success(newStarred ? "Message starred" : "Message unstarred");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleTranslate = async (langName) => {
    setShowTranslateMenu(false);
    if (!message.message) return;
    const result = await translateText(message.message, langName);
    if (result) {
      setTranslation({ lang: langName, text: result });
    }
  };

  const handleTranscribeAudio = async () => {
    toast.loading("Transcribing voice note...", { id: "transcribe" });
    setTimeout(() => {
      setTranscript("Voice note transcript: 'Hey! I will call you back in 10 minutes.'");
      toast.success("Voice note transcribed!", { id: "transcribe" });
    }, 1500);
  };

  const handleDeleteMessage = async () => {
    try {
      const res = await fetch(`/api/messages/${message._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      removeMessageFromState(message._id);
      toast.success("Message deleted");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCopyText = () => {
    if (!message.message) return;
    navigator.clipboard.writeText(message.message);
    setIsCopied(true);
    toast.success("Copied to clipboard!", { id: "copy-toast" });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFeedback = async (rating, tags = []) => {
    setShowTagPicker(false);
    try {
      const newRating = feedbackRating === rating ? null : rating;
      if (!newRating) {
        setFeedbackRating(null);
        return;
      }
      setFeedbackRating(rating);

      // Find preceding user prompt
      const msgList = messages || [];
      const messageIndex = msgList.findIndex((m) => m._id === message._id);
      let userPrompt = "";
      if (messageIndex > 0) {
        for (let i = messageIndex - 1; i >= 0; i--) {
          const prev = msgList[i];
          const prevSenderId = prev.senderId?._id || prev.senderId;
          if (prevSenderId === authUser._id || prev.role === "user") {
            userPrompt = prev.message || "";
            break;
          }
        }
      }

      const charId = message.characterId || activeCharacterId || selectedConversation?.characterId || "kabir";

      const res = await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: message._id,
          characterId: charId,
          userPrompt: userPrompt,
          aiResponse: message.message,
          rating: rating,
          tags: tags,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (rating === "positive") {
        toast.success("Positive feedback logged for RLHF fine-tuning! 👍", { id: `fb-${message._id}` });
      } else {
        toast("Negative feedback logged for model alignment! 👎", { id: `fb-${message._id}`, icon: "📉" });
      }
    } catch (err) {
      console.error("Feedback error:", err);
      toast.error(err.message || "Failed to submit feedback");
    }
  };

  const isAudioFile = message.fileType === "audio" || (message.fileUrl && message.fileUrl.match(/\.(mp3|wav|ogg|webm)$/i));
  const isImageFile = message.fileType === "image" || (message.fileUrl && message.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i));
  const isVideoFile = message.fileType === "video" || (message.fileUrl && message.fileUrl.match(/\.(mp4|webm|mov)$/i));
  const isDocFile = message.fileType === "document" || (!isAudioFile && !isImageFile && !isVideoFile && message.fileUrl);

  return (
    <div className={`chat ${chatClassName} group relative mb-2 animate-fade-in`}>
      
      {/* Avatar */}
      <div className="chat-image avatar">
        <Avatar src={profilePic} name={senderName} className="w-8 h-8 rounded-full border border-white/10" />
      </div>

      {/* Header Name for Group/AI */}
      <div className="chat-header text-[10px] text-[var(--text-muted)] mb-0.5 flex items-center gap-1.5">
        <span>{senderName}</span>
        {isStarred && <FaStar className="text-amber-400 text-[9px]" title="Starred" />}
        <time className="text-[9px] opacity-60">{formattedTime}</time>
      </div>

      {/* Bubble Container */}
      <div 
        onContextMenu={(e) => {
          if (isAssistantBubble) {
            e.preventDefault();
            e.stopPropagation();
            setShowNegativeTagView(false);
            setShowFeedbackMenu((prev) => !prev);
          }
        }}
        onDoubleClick={(e) => {
          if (isAssistantBubble) {
            e.preventDefault();
            e.stopPropagation();
            setShowNegativeTagView(false);
            setShowFeedbackMenu((prev) => !prev);
          }
        }}
        title={isAssistantBubble ? "Double-click or Right-click for AI feedback options" : undefined}
        className={`chat-bubble max-w-xs md:max-w-md p-3 shadow-md relative group/bubble ${bubbleBgColor} ${shakeClass} ${isAssistantBubble ? "cursor-pointer" : ""}`}
      >
        
        {/* Reply Preview inside Bubble */}
        {message.replyTo && (
          <div className={`mb-2 p-1.5 rounded text-[11px] opacity-90 truncate ${isVibrantUser ? "bg-black/10 border-l-2 border-gray-900/50 text-gray-900" : "bg-black/20 border-l-2 border-purple-300"}`}>
            <span className={`font-semibold block text-[10px] ${isVibrantUser ? "text-gray-800" : "text-purple-200"}`}>
              Replying to {
                typeof message.replyTo === "object"
                  ? (message.replyTo.senderId === authUser._id || message.replyTo.senderId?._id === authUser._id ? "You" : "Partner")
                  : "Message"
              }
            </span>
            <span className="truncate block">
              {typeof message.replyTo === "object"
                ? (message.replyTo.message || message.replyTo.fileName || "Attachment")
                : "Replied message"}
            </span>
          </div>
        )}

        {/* Deleted Message */}
        {message.isDeleted ? (
          <p className="italic opacity-60 text-xs flex items-center gap-1">
            <FaTrash className="text-[10px]" /> This message was deleted
          </p>
        ) : (
          <>
            {/* Attachment Handling */}
            {message.fileUrl && (
              <div className="mb-2">
                {isImageFile && (
                  <div className="relative rounded-lg overflow-hidden cursor-pointer group/img max-h-60" onClick={() => onOpenLightbox && onOpenLightbox(message)}>
                    <img src={message.fileUrl} alt="Media Attachment" className="w-full h-full object-cover transition-transform group-hover/img:scale-105" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-xs bg-black/60 text-white px-2 py-1 rounded-full backdrop-blur-sm">View Full Screen</span>
                    </div>
                  </div>
                )}

                {isVideoFile && (
                  <div className="relative rounded-lg overflow-hidden max-h-60 cursor-pointer" onClick={() => onOpenLightbox && onOpenLightbox(message)}>
                    <video src={message.fileUrl} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <FaPlay className="text-white text-2xl drop-shadow-md" />
                    </div>
                  </div>
                )}

                {isAudioFile && (
                  <div className={`flex items-center gap-3 p-2 rounded-xl border min-w-[200px] backdrop-blur-md ${isVibrantUser ? "bg-black/10 border-gray-900/20" : "bg-black/30 border-white/10"}`}>
                    <audio ref={audioRef} src={message.fileUrl} onTimeUpdate={handleAudioTimeUpdate} onEnded={handleAudioEnded} className="hidden" />
                    <button type="button" onClick={togglePlayAudio} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors flex-shrink-0 ${isVibrantUser ? "bg-gray-900 hover:bg-black text-white" : "bg-purple-500 hover:bg-purple-400 text-white"}`}>
                      {isPlayingAudio ? <FaPause /> : <FaPlay className="ml-0.5" />}
                    </button>
                    <div className="flex-1 flex flex-col gap-1">
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${isVibrantUser ? "bg-black/20" : "bg-white/20"}`}>
                        <div className={`h-full transition-all duration-100 ${isVibrantUser ? "bg-gray-900" : "bg-purple-300"}`} style={{ width: `${audioProgress}%` }} />
                      </div>
                      <div className={`flex justify-between items-center text-[9px] ${isVibrantUser ? "text-gray-800" : "text-white/70"}`}>
                        <span>Voice Note</span>
                        <span>{audioDuration}</span>
                      </div>
                    </div>
                    <button type="button" onClick={handleTranscribeAudio} className={`p-1 transition-colors ${isVibrantUser ? "text-gray-800 hover:text-black" : "text-purple-200 hover:text-white"}`} title="Transcribe Voice Note">
                      <FaFileAlt className="text-xs" />
                    </button>
                  </div>
                )}

                {isDocFile && (
                  <div className={`flex items-center justify-between p-2.5 rounded-xl border gap-3 ${isVibrantUser ? "bg-black/10 border-gray-900/20" : "bg-black/30 border-white/10"}`}>
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-xl">📄</span>
                      <div className="flex flex-col truncate">
                        <span className={`text-xs font-semibold truncate ${isVibrantUser ? "text-gray-900" : "text-white"}`}>{message.fileName || "Document"}</span>
                        <span className={`text-[9px] ${isVibrantUser ? "text-gray-800" : "text-white/60"}`}>{(message.fileSize ? message.fileSize / 1024 : 0).toFixed(1)} KB</span>
                      </div>
                    </div>
                    <a href={message.fileUrl} target="_blank" rel="noreferrer" download className={`p-2 rounded-lg transition-colors ${isVibrantUser ? "bg-black/10 hover:bg-black/20 text-gray-900" : "bg-white/10 hover:bg-white/20 text-white"}`}>
                      <FaDownload className="text-xs" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Audio Transcript View */}
            {transcript && (
              <div className={`mb-2 p-2 border rounded-lg text-xs backdrop-blur-md ${isVibrantUser ? "bg-white/40 border-gray-900/20 text-gray-900" : "bg-purple-900/40 border-purple-500/30 text-purple-200"}`}>
                <span className={`font-semibold block text-[10px] ${isVibrantUser ? "text-gray-800" : "text-purple-300"}`}>Transcript:</span>
                <p>{transcript}</p>
              </div>
            )}

            {/* Main Text Content */}
            {message.message && (
              <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">{message.message}</p>
            )}

            {/* Translation Output */}
            {translation && (
              <div className={`mt-2 pt-2 border-t text-xs animate-fade-in ${isVibrantUser ? "border-gray-900/15 text-gray-800" : "border-white/15 text-purple-200"}`}>
                <span className={`font-semibold text-[10px] block mb-0.5 ${isVibrantUser ? "text-gray-800" : "text-purple-300"}`}>Translation ({translation.lang}):</span>
                <p>{translation.text}</p>
              </div>
            )}
          </>
        )}

        {/* Message Status, Read Receipts & Feedback Badge */}
        <div className={`flex items-center justify-end gap-1.5 mt-1 text-[9px] ${isVibrantUser ? "text-gray-800 opacity-80" : "opacity-70"}`}>
          {/* Subtle RLHF Feedback Indicator Badge if already rated */}
          {feedbackRating && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowFeedbackMenu(true);
              }}
              className={`flex items-center gap-0.5 px-1 py-0.2 rounded text-[8px] font-semibold transition-all ${
                feedbackRating === "positive"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-400/30"
                  : "bg-rose-500/20 text-rose-400 border border-rose-400/30"
              }`}
              title={`Feedback: ${feedbackRating}. Click to change.`}
            >
              {feedbackRating === "positive" ? <FaThumbsUp className="text-[7px]" /> : <FaThumbsDown className="text-[7px]" />}
              <span>{feedbackRating === "positive" ? "Liked" : "Flagged"}</span>
            </button>
          )}

          {message.isEdited && <span className="italic mr-1">(edited)</span>}
          {fromMe && (
            <span>
              {message.isRead ? <FaCheckDouble className={isVibrantUser ? "text-gray-900" : "text-blue-400"} /> : <FaCheck />}
            </span>
          )}
        </div>

        {/* Emoji Reactions List */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="absolute -bottom-2.5 right-2 flex items-center gap-0.5 bg-slate-900/90 border border-white/15 rounded-full px-1.5 py-0.5 text-[10px] shadow-lg backdrop-blur-md z-10">
            {message.reactions.map((r, idx) => (
              <span key={idx} title={r.userId?.fullName || "User"}>{r.emoji}</span>
            ))}
          </div>
        )}

        {/* Double-Click / Right-Click AI Feedback Popover Menu */}
        {showFeedbackMenu && isAssistantBubble && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-40 w-64 bg-slate-900/95 border border-purple-500/40 rounded-2xl p-3 shadow-2xl backdrop-blur-xl animate-scale-up text-white text-xs space-y-2.5"
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="font-bold text-[11px] text-purple-300 flex items-center gap-1.5">
                <span>✨</span> AI Response Feedback
              </span>
              <button 
                type="button" 
                onClick={() => setShowFeedbackMenu(false)} 
                className="text-gray-400 hover:text-white p-0.5"
              >
                ✕
              </button>
            </div>

            {/* Quick Rating Choices */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFeedback("positive")}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border transition-all text-xs font-semibold ${
                  feedbackRating === "positive"
                    ? "bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                    : "bg-white/5 border-white/10 hover:bg-emerald-500/20 hover:border-emerald-500/40 text-gray-200"
                }`}
              >
                <FaThumbsUp className="text-emerald-400 text-xs" />
                <span>Good (👍)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowNegativeTagView(!showNegativeTagView)}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border transition-all text-xs font-semibold ${
                  feedbackRating === "negative"
                    ? "bg-rose-500/25 border-rose-400 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                    : "bg-white/5 border-white/10 hover:bg-rose-500/20 hover:border-rose-500/40 text-gray-200"
                }`}
              >
                <FaThumbsDown className="text-rose-400 text-xs" />
                <span>Bad (👎)</span>
              </button>
            </div>

            {/* Detailed Issue Tags for Negative Feedback */}
            {showNegativeTagView && (
              <div className="space-y-1.5 pt-1 border-t border-white/10 animate-fade-in">
                <span className="text-[10px] text-gray-400 font-medium block">What was wrong with this response?</span>
                <div className="flex flex-wrap gap-1">
                  {[
                    "Out of Character",
                    "Repetitive",
                    "Bad Grammar",
                    "Word Salad",
                    "Offensive",
                    "Too Robotic",
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleFeedback("negative", [tag.toLowerCase().replace(/ /g, "_")])}
                      className="px-2 py-0.5 rounded-full text-[9px] bg-white/10 hover:bg-rose-500/25 hover:text-rose-300 hover:border-rose-400/40 border border-white/5 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => handleFeedback("negative", [])}
                  className="w-full py-1 text-center text-[10px] text-gray-400 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Submit Dislike without tag
                </button>
              </div>
            )}

            {/* Utility Quick Links inside Menu */}
            <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px] text-gray-400">
              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center gap-1 hover:text-purple-300 transition-colors"
              >
                {isCopied ? <FaCheck className="text-emerald-400" /> : <FaCopy />}
                <span>{isCopied ? "Copied!" : "Copy Text"}</span>
              </button>

              <span className="text-[9px] opacity-50">RLHF Dataset Queue</span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Menu on Hover */}
      {!message.isDeleted && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 flex items-center gap-1 bg-slate-900/90 border border-white/10 rounded-full px-2 py-1 shadow-xl z-20 backdrop-blur-md" style={{ [fromMe ? "right" : "left"]: "100%", margin: "0 8px" }}>
          
          <button onClick={() => setReplyingTo(message)} className="p-1 text-slate-300 hover:text-white transition-colors" title="Reply">
            <FaReply className="text-xs" />
          </button>

          <button onClick={handleToggleStar} className={`p-1 transition-colors ${isStarred ? "text-amber-400" : "text-slate-300 hover:text-white"}`} title="Star Message">
            <FaStar className="text-xs" />
          </button>

          <button onClick={() => setShowReactionPicker(!showReactionPicker)} className="p-1 text-slate-300 hover:text-white transition-colors" title="React">
            <FaSmile className="text-xs" />
          </button>

          <button onClick={() => setShowTranslateMenu(!showTranslateMenu)} className="p-1 text-purple-300 hover:text-white transition-colors" title="Translate">
            <FaGlobe className="text-xs" />
          </button>

          {fromMe && message.message && (
            <button onClick={() => setEditingMessage(message)} className="p-1 text-slate-300 hover:text-white transition-colors" title="Edit">
              <FaPencilAlt className="text-xs" />
            </button>
          )}

          {fromMe && (
            <button onClick={handleDeleteMessage} className="p-1 text-red-400 hover:text-red-300 transition-colors" title="Delete">
              <FaTrash className="text-xs" />
            </button>
          )}
        </div>
      )}

      {/* Quick Reaction Picker Popover */}
      {showReactionPicker && (
        <div className="absolute top-8 z-30 flex items-center gap-1 bg-slate-900 border border-white/10 rounded-full p-1.5 shadow-2xl backdrop-blur-md animate-scale-up" style={{ [fromMe ? "right" : "left"]: "0" }}>
          {quickEmojis.map((emoji, idx) => (
            <button key={idx} onClick={() => handleAddReaction(emoji)} className="text-base hover:scale-125 transition-transform p-1">
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Language Translate Popover */}
      {showTranslateMenu && (
        <div className="absolute top-8 z-30 w-36 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-1 max-h-48 overflow-y-auto backdrop-blur-md animate-scale-up" style={{ [fromMe ? "right" : "left"]: "0" }}>
          <span className="text-[10px] text-purple-300 font-semibold px-2 py-1 block border-b border-white/5 mb-1">Translate to:</span>
          {languages.map((l) => (
            <button key={l.name} onClick={() => handleTranslate(l.name)} className="w-full text-left px-2 py-1 hover:bg-white/10 rounded text-[11px] text-slate-200">
              {l.code}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Message;
