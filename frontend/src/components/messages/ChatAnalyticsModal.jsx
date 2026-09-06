import { FaTimes, FaComments, FaImage, FaMicrophone, FaFont, FaCalendarAlt, FaChartBar } from "react-icons/fa";
import Avatar from "../Avatar";

const ChatAnalyticsModal = ({ conversation, messages = [], isOpen, onClose }) => {
  if (!isOpen || !conversation) return null;

  const isGroup = conversation.isGroup;
  const title = isGroup ? conversation.groupName : conversation.fullName;
  const avatarSrc = isGroup ? conversation.groupPic : conversation.profilePic;

  // Stats calculation
  const totalMessages = messages.length;
  let totalWords = 0;
  let mediaCount = 0;
  let voiceNotesCount = 0;

  messages.forEach((m) => {
    if (m.message) {
      totalWords += m.message.trim().split(/\s+/).filter(Boolean).length;
    }
    if (m.fileType === "image" || m.fileType === "video" || m.fileType === "document") {
      mediaCount += 1;
    }
    if (m.fileType === "audio") {
      voiceNotesCount += 1;
    }
  });

  const firstMsgDate = messages[0]?.createdAt ? new Date(messages[0].createdAt).toLocaleDateString() : "N/A";
  const lastMsgDate = messages[messages.length - 1]?.createdAt ? new Date(messages[messages.length - 1].createdAt).toLocaleDateString() : "N/A";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in text-white">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-purple-400 font-semibold">
            <FaChartBar />
            <span>Chat Analytics</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <FaTimes />
          </button>
        </div>

        {/* User / Group Header */}
        <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
          <Avatar src={avatarSrc} name={title} className="w-12 h-12" />
          <div className="flex flex-col truncate">
            <h4 className="font-bold text-base truncate">{title}</h4>
            <span className="text-xs text-slate-400">
              {isGroup ? `${conversation.participants?.length || 0} Group Members` : "Direct Conversation"}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          
          <div className="bg-purple-950/30 border border-purple-500/20 p-3 rounded-xl flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-purple-400 font-semibold">
              <FaComments /> Total Messages
            </div>
            <span className="text-2xl font-bold text-white">{totalMessages}</span>
          </div>

          <div className="bg-blue-950/30 border border-blue-500/20 p-3 rounded-xl flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
              <FaFont /> Word Count
            </div>
            <span className="text-2xl font-bold text-white">{totalWords}</span>
          </div>

          <div className="bg-emerald-950/30 border border-emerald-500/20 p-3 rounded-xl flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <FaImage /> Media Files
            </div>
            <span className="text-2xl font-bold text-white">{mediaCount}</span>
          </div>

          <div className="bg-amber-950/30 border border-amber-500/20 p-3 rounded-xl flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <FaMicrophone /> Voice Notes
            </div>
            <span className="text-2xl font-bold text-white">{voiceNotesCount}</span>
          </div>

        </div>

        {/* Activity Timeline */}
        <div className="bg-black/30 border border-white/5 rounded-xl p-3 text-xs space-y-1.5">
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <FaCalendarAlt /> First Message:
            </span>
            <span className="font-semibold text-white">{firstMsgDate}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <FaCalendarAlt /> Latest Activity:
            </span>
            <span className="font-semibold text-white">{lastMsgDate}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChatAnalyticsModal;
