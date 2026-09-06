import { useState, useEffect } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { FaTimes, FaThumbsUp, FaThumbsDown, FaDownload, FaBrain, FaSyncAlt, FaLock } from "react-icons/fa";
import toast from "react-hot-toast";

const AIFeedbackModal = ({ isOpen, onClose, defaultCharacterId }) => {
  const { authUser } = useAuthContext();
  const isAdmin = Boolean(
    authUser &&
    ((authUser.email || "").toLowerCase() === "bhaveshgode676@gmail.com" ||
     (authUser.username || "").toLowerCase() === "bhaveshgode676" ||
     (authUser.username || "").toLowerCase() === "bhavesh_admin")
  );

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCharFilter, setSelectedCharFilter] = useState(defaultCharacterId || "all");

  const fetchStats = async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const url = selectedCharFilter === "all" 
        ? "/api/ai/feedback/stats" 
        : `/api/ai/feedback/stats?characterId=${selectedCharFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStats(data);
    } catch (err) {
      toast.error(err.message || "Failed to load feedback stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAdmin) {
      fetchStats();
    }
  }, [isOpen, selectedCharFilter, isAdmin]);

  const handleExportJSONL = (ratingFilter = "positive") => {
    const charParam = selectedCharFilter === "all" ? "" : `&characterId=${selectedCharFilter}`;
    const url = `/api/ai/feedback/export?format=jsonl&rating=${ratingFilter}${charParam}`;
    
    // Trigger download
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `rlhf_dataset_${selectedCharFilter}_${ratingFilter}.jsonl`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exporting ${ratingFilter} dataset (.jsonl) for fine-tuning! 🚀`);
  };

  if (!isOpen || !isAdmin) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-white">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg">
              <FaBrain className="text-white text-base" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                RLHF & Fine-Tuning Pipeline
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  Phase 1 Dataset
                </span>
              </h2>
              <p className="text-[11px] text-gray-400">Collected preference pairs from user thumbs up/down feedback</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        {/* Filters & Actions Bar */}
        <div className="px-4 py-3 border-b border-white/10 bg-slate-950/40 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-[11px]">Character:</span>
            <select
              value={selectedCharFilter}
              onChange={(e) => setSelectedCharFilter(e.target.value)}
              className="bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Characters</option>
              <option value="kabir">Kabir</option>
              <option value="pippaa">Pippaa</option>
              <option value="ghalib">Mirza Ghalib</option>
              <option value="tara">Martina</option>
              <option value="sid">Sid</option>
              <option value="maverick">Maverick</option>
            </select>
            <button
              onClick={fetchStats}
              disabled={loading}
              className="p-1.5 text-gray-400 hover:text-purple-300 transition-colors"
              title="Refresh Stats"
            >
              <FaSyncAlt className={`text-xs ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportJSONL("positive")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-medium text-xs shadow-md transition-transform hover:scale-105"
              title="Export positive pairs as JSONL"
            >
              <FaDownload className="text-[10px]" />
              Export JSONL (SFT)
            </button>
            <button
              onClick={() => handleExportJSONL("negative")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/15 text-gray-300 rounded-lg text-xs transition-colors"
              title="Export negative pairs for DPO/RLHF"
            >
              <FaDownload className="text-[10px]" />
              Negative Set
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/60 border border-white/10 rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Pairs</span>
              <p className="text-xl font-extrabold text-white mt-0.5">{stats?.summary?.total ?? 0}</p>
            </div>
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center justify-center gap-1">
                <FaThumbsUp className="text-[9px]" /> Liked
              </span>
              <p className="text-xl font-extrabold text-emerald-400 mt-0.5">{stats?.summary?.positive ?? 0}</p>
            </div>
            <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center justify-center gap-1">
                <FaThumbsDown className="text-[9px]" /> Disliked
              </span>
              <p className="text-xl font-extrabold text-rose-400 mt-0.5">{stats?.summary?.negative ?? 0}</p>
            </div>
            <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">Approval Rate</span>
              <p className="text-xl font-extrabold text-purple-300 mt-0.5">{stats?.summary?.approvalRate ?? "0%"}</p>
            </div>
          </div>

          {/* Breakdown by Character */}
          {stats?.breakdown && Object.keys(stats.breakdown).length > 0 && (
            <div className="bg-slate-800/40 border border-white/10 rounded-xl p-3">
              <h3 className="text-xs font-semibold text-gray-300 mb-2">Character Distribution</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(stats.breakdown).map(([char, counts]) => (
                  <div key={char} className="bg-slate-900/60 p-2 rounded-lg border border-white/5 text-xs flex justify-between items-center">
                    <span className="font-semibold capitalize text-gray-200">{char}</span>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-emerald-400 flex items-center gap-0.5"><FaThumbsUp className="text-[9px]" /> {counts.positive || 0}</span>
                      <span className="text-rose-400 flex items-center gap-0.5"><FaThumbsDown className="text-[9px]" /> {counts.negative || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Samples List */}
          <div>
            <h3 className="text-xs font-semibold text-gray-300 mb-2">Recent Feedback Log Entries</h3>
            {stats?.recentSamples?.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400 bg-slate-850/30 rounded-xl border border-dashed border-white/10">
                No feedback pairs recorded yet. Click the 👍 or 👎 buttons on AI chat messages to start building your dataset!
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {stats?.recentSamples?.map((sample, idx) => (
                  <div 
                    key={idx} 
                    className="p-2.5 rounded-xl bg-slate-800/40 border border-white/5 hover:border-white/15 transition-colors text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold capitalize text-purple-300">{sample.characterId}</span>
                        {sample.rating === "positive" ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                            <FaThumbsUp className="text-[8px]" /> Positive
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-400/30 flex items-center gap-1">
                            <FaThumbsDown className="text-[8px]" /> Negative
                          </span>
                        )}
                        {sample.tags?.map((t, tidx) => (
                          <span key={tidx} className="px-1.5 py-0.5 rounded text-[9px] bg-white/10 text-gray-300">
                            {t}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {new Date(sample.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {sample.userPrompt && (
                      <div className="text-[11px] text-gray-400 truncate">
                        <span className="text-gray-400 font-semibold">User:</span> {sample.userPrompt}
                      </div>
                    )}
                    <div className="text-[11px] text-gray-200 line-clamp-2">
                      <span className="text-purple-300 font-semibold">AI:</span> {sample.aiResponse}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950/80 border-t border-white/10 text-[11px] text-gray-400 flex items-center justify-between">
          <span>Target for fine-tuning: ~500+ validated pairs</span>
          <span className="text-purple-400 font-medium">Ready for Unsloth / Hugging Face / Ollama</span>
        </div>

      </div>
    </div>
  );
};

export default AIFeedbackModal;
