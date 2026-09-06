import { useState } from "react";
import Conversations from "./Conversations";
import LogoutButton from "./LogoutButton";
import SearchInput from "./SearchInput";
import CreateGroupModal from "./CreateGroupModal";
import { useTheme, themesList } from "../../context/ThemeContext";
import { FaUserPlus, FaComments, FaUsers, FaPalette, FaRobot } from "react-icons/fa";

const Sidebar = () => {
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const { theme, setTheme } = useTheme();
  const isMidnight = theme === "midnight" || theme === "classic" || theme === "midnight-cozy";
  const isLilac = theme === "lilac" || theme === "cyberpunk" || theme === "lilac-lavender";
  const isSapphire = theme === "sapphire" || theme === "dark-sapphire";
  const isForest = theme === "forest" || theme === "sage-forest";

  const sidebarBgClass = isMidnight
    ? "bg-[#111827] border-r border-white/5"
    : isLilac
    ? "bg-[#1d1128] border-r border-white/5"
    : isSapphire
    ? "bg-[#060B14] border-r border-white/5"
    : isForest
    ? "bg-[#050C09] border-r border-white/5"
    : "border-r border-[color:var(--panel-border)] bg-[var(--panel-bg)]";

  return (
    <div className={`p-4 flex flex-col w-full sm:w-[280px] md:w-[320px] flex-shrink-0 h-full relative z-20 ${sidebarBgClass}`}>

      {/* Header Actions */}
      <div className="flex items-center justify-between mb-3 gap-1 relative z-30">
        <SearchInput />

        {/* Theme Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2.5 rounded-xl bg-[var(--panel-bg)] hover:bg-[var(--accent)]/10 text-[color:var(--text-main)] border border-[color:var(--panel-border)] transition-all text-xs font-semibold"
            title="Switch Theme"
          >
            <FaPalette />
          </button>
          {showThemeMenu && (
            <div className="absolute right-0 top-11 w-48 bg-[var(--panel-bg)] border border-[color:var(--panel-border)] rounded-xl shadow-2xl p-1.5 z-50 text-xs backdrop-blur-md animate-fade-in">
              <span className="text-[10px] font-semibold text-[color:var(--text-muted)] px-2 py-1 block border-b border-[color:var(--panel-border)] mb-1">Select Theme</span>
              {themesList.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTheme(t.id); setShowThemeMenu(false); }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between hover:bg-[var(--accent)]/10 ${theme === t.id ? "text-[var(--accent)] font-bold bg-[var(--accent)]/10" : "text-[color:var(--text-muted)] hover:text-[color:var(--text-main)]"}`}
                >
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Create Group Button */}
        <button
          onClick={() => setIsCreateGroupOpen(true)}
          className="p-2.5 rounded-xl bg-[var(--accent)]/15 hover:bg-[var(--accent)]/25 text-[color:var(--text-main)] border border-[color:var(--panel-border)] transition-all flex items-center gap-1.5 text-xs font-semibold flex-shrink-0"
          title="Create Group"
        >
          <FaUserPlus />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-[var(--panel-bg)] p-1 rounded-xl border border-[color:var(--panel-border)] mb-3 text-[11px] font-medium gap-0.5">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 py-1.5 rounded-lg transition-colors text-center ${activeTab === "all" ? "bg-[var(--accent)] text-white shadow" : "text-[color:var(--text-muted)] hover:text-[color:var(--text-main)]"}`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab("direct")}
          className={`flex-1 py-1.5 rounded-lg transition-colors text-center flex items-center justify-center gap-1 ${activeTab === "direct" ? "bg-[var(--accent)] text-white shadow" : "text-[color:var(--text-muted)] hover:text-[color:var(--text-main)]"}`}
          title="Genuine Human Contacts Only"
        >
          <FaComments className="text-[10px]" /> Direct
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={`flex-1 py-1.5 rounded-lg transition-colors text-center flex items-center justify-center gap-1 ${activeTab === "ai" ? "bg-[var(--accent)] text-white shadow" : "text-[color:var(--text-muted)] hover:text-[color:var(--text-main)]"}`}
          title="AI Characters & Bots"
        >
          <FaRobot className="text-[10px]" /> AI Bots
        </button>
        <button
          onClick={() => setActiveTab("groups")}
          className={`flex-1 py-1.5 rounded-lg transition-colors text-center flex items-center justify-center gap-1 ${activeTab === "groups" ? "bg-[var(--accent)] text-white shadow" : "text-[color:var(--text-muted)] hover:text-[color:var(--text-main)]"}`}
        >
          <FaUsers className="text-[10px]" /> Groups
        </button>
      </div>

      <Conversations activeTab={activeTab} />
      <LogoutButton />

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
      />
    </div>
  );
};

export default Sidebar;
