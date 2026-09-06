import { useState } from "react";
import { FaTimes, FaCrown, FaSignOutAlt, FaUserMinus, FaUserPlus } from "react-icons/fa";
import { useAuthContext } from "../../context/AuthContext";
import useGroup from "../../hooks/useGroup";
import useGetConversations from "../../hooks/useGetConversations";
import Avatar from "../Avatar";

const GroupInfoModal = ({ group, isOpen, onClose, onGroupUpdated }) => {
  const { authUser } = useAuthContext();
  const { removeGroupMember, addGroupMember, loading } = useGroup();
  const { conversations } = useGetConversations();
  const [showAddMember, setShowAddMember] = useState(false);

  if (!isOpen || !group) return null;

  const adminId = group.groupAdmin?._id || group.groupAdmin;
  const isAdmin = authUser._id === adminId;
  const participants = group.participants || [];

  const handleRemove = async (userIdToRemove) => {
    const updated = await removeGroupMember({ groupId: group._id, userIdToRemove });
    if (updated && onGroupUpdated) onGroupUpdated(updated);
    if (userIdToRemove === authUser._id) onClose();
  };

  const handleAdd = async (userIdToAdd) => {
    const updated = await addGroupMember({ groupId: group._id, userIdToAdd });
    if (updated && onGroupUpdated) onGroupUpdated(updated);
    setShowAddMember(false);
  };

  // Contacts not yet in group
  const nonGroupContacts = conversations.filter(
    (c) => !participants.some((p) => p._id === c._id || p === c._id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in text-white">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-lg font-semibold">Group Info</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <FaTimes />
          </button>
        </div>

        {/* Group Profile Header */}
        <div className="flex flex-col items-center text-center space-y-2 py-2">
          <Avatar src={group.groupPic} name={group.groupName} className="w-20 h-20 border-2 border-purple-500 shadow-lg" />
          <h4 className="text-xl font-bold">{group.groupName}</h4>
          <p className="text-xs text-purple-400 font-medium">{participants.length} Members</p>
        </div>

        {/* Members List Header */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Members</span>
          {isAdmin && (
            <button
              onClick={() => setShowAddMember(!showAddMember)}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
            >
              <FaUserPlus /> {showAddMember ? "Close" : "Add Member"}
            </button>
          )}
        </div>

        {/* Add Member Dropdown Panel */}
        {showAddMember && (
          <div className="bg-black/30 border border-white/10 rounded-xl p-2 max-h-36 overflow-y-auto space-y-1 animate-slide-down">
            {nonGroupContacts.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">All contacts are already in this group</p>
            ) : (
              nonGroupContacts.map((c) => (
                <div key={c._id} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/5 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <Avatar src={c.profilePic} name={c.fullName} className="w-7 h-7" />
                    <span className="truncate">{c.fullName}</span>
                  </div>
                  <button
                    onClick={() => handleAdd(c._id)}
                    className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-medium text-[10px]"
                  >
                    Add
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Participants Scroll List */}
        <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
          {participants.map((p) => {
            const pId = p._id || p;
            const isUserAdmin = pId === adminId;
            return (
              <div key={pId} className="flex items-center justify-between p-2 rounded-xl bg-black/20 border border-white/5 text-xs">
                <div className="flex items-center gap-2.5 truncate">
                  <Avatar src={p.profilePic} name={p.fullName || "User"} className="w-9 h-9" />
                  <div className="flex flex-col truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold truncate text-white">{p.fullName || "User"}</span>
                      {isUserAdmin && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <FaCrown className="text-[9px]" /> Admin
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 truncate">{p.bio || "GuppShup member"}</span>
                  </div>
                </div>

                {/* Actions */}
                {isAdmin && pId !== authUser._id && (
                  <button
                    onClick={() => handleRemove(pId)}
                    disabled={loading}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-full transition-colors"
                    title="Remove Member"
                  >
                    <FaUserMinus className="text-xs" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Leave Group Action Button */}
        <div className="pt-2 border-t border-white/10">
          <button
            onClick={() => handleRemove(authUser._id)}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <FaSignOutAlt /> Leave Group
          </button>
        </div>

      </div>
    </div>
  );
};

export default GroupInfoModal;
