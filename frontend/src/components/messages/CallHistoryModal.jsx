import { useEffect, useState } from "react";
import { FaPhone, FaVideo, FaPhoneSlash, FaArrowUp, FaArrowDown, FaTimes, FaClock } from "react-icons/fa";
import { useAuthContext } from "../../context/AuthContext";

const CallHistoryModal = ({ conversation, isOpen, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const { authUser } = useAuthContext();

  useEffect(() => {
    if (!isOpen || !conversation?._id || conversation?.isGroup || conversation?.isAI) return;

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/messages/calls/${conversation._id}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setLogs(data);
        } else {
          setLogs([]);
        }
      } catch (err) {
        console.error("Error fetching call logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [isOpen, conversation]);

  if (!isOpen) return null;

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins > 0 ? `${mins}m ` : ""}${secs}s`;
  };

  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[var(--panel-bg)] border border-[var(--panel-border)] text-[var(--text-main)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[var(--panel-border)] flex items-center justify-between bg-black/10">
          <div className="flex items-center gap-2">
            <FaClock className="text-[var(--accent)] text-lg" />
            <h2 className="text-base font-bold">Call History</h2>
            <span className="text-xs text-[var(--text-muted)] font-normal">with {conversation?.fullName}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-black/10 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-2">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <span className="loading loading-spinner text-[var(--accent)]"></span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 text-[var(--text-muted)] text-sm">
              <FaPhoneSlash className="mx-auto text-3xl mb-2 opacity-40" />
              No call history with {conversation?.fullName}
            </div>
          ) : (
            logs.map((log) => {
              const isOutgoing = String(log.callerId) === String(authUser?._id);
              const isMissedOrDeclined = log.status === "missed" || log.status === "declined";

              return (
                <div
                  key={log._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-black/5 hover:bg-black/10 border border-[var(--panel-border)] transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-full ${isMissedOrDeclined ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}`}>
                      {log.callType === "video" ? <FaVideo /> : <FaPhone />}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 font-semibold text-sm">
                        {isOutgoing ? (
                          <FaArrowUp className="text-[10px] text-blue-400" />
                        ) : (
                          <FaArrowDown className={`text-[10px] ${isMissedOrDeclined ? "text-red-400" : "text-green-400"}`} />
                        )}
                        <span>{isOutgoing ? "Outgoing Call" : "Incoming Call"}</span>
                      </div>
                      <span className="text-[11px] text-[var(--text-muted)]">{formatTime(log.createdAt)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        log.status === "completed"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : log.status === "missed"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {log.status}
                    </span>
                    {log.duration > 0 && (
                      <span className="block text-[10px] text-[var(--text-muted)] mt-0.5 font-mono">
                        {formatDuration(log.duration)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[var(--panel-border)] text-right bg-black/10">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallHistoryModal;
