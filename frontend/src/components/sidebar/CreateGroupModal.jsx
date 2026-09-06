import { useState } from "react";
import { FaTimes, FaUserPlus, FaCheck } from "react-icons/fa";
import useGetConversations from "../../hooks/useGetConversations";
import useGroup from "../../hooks/useGroup";
import Avatar from "../Avatar";

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const [groupName, setGroupName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const { conversations } = useGetConversations();
  const { createGroup, loading } = useGroup();

  if (!isOpen) return null;

  const toggleSelectUser = (id) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter((uId) => uId !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || selectedUserIds.length === 0) return;

    const newGroup = await createGroup({
      groupName: groupName.trim(),
      participantIds: selectedUserIds,
    });

    if (newGroup) {
      setGroupName("");
      setSelectedUserIds([]);
      if (onGroupCreated) onGroupCreated(newGroup);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in text-white">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <FaUserPlus className="text-purple-400 text-lg" />
            <h3 className="text-lg font-semibold">Create New Group</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group Name Input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Group Title</label>
            <input
              type="text"
              placeholder="e.g. Project Devs, Chill Lounge..."
              className="w-full text-sm py-2 px-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </div>

          {/* Member Selection List */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Select Contacts ({selectedUserIds.length} selected)
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {conversations.map((c) => {
                const isSelected = selectedUserIds.includes(c._id);
                return (
                  <div
                    key={c._id}
                    onClick={() => toggleSelectUser(c._id)}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors border ${
                      isSelected ? "bg-purple-600/20 border-purple-500" : "bg-black/20 border-transparent hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Avatar src={c.profilePic} name={c.fullName} className="w-8 h-8" />
                      <div className="flex flex-col truncate">
                        <span className="text-xs font-medium truncate">{c.fullName}</span>
                        <span className="text-[10px] text-slate-400">@{c.username}</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isSelected ? "bg-purple-500 border-purple-500" : "border-slate-500"}`}>
                      {isSelected && <FaCheck className="text-[10px] text-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !groupName.trim() || selectedUserIds.length === 0}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-xs font-medium text-white shadow-lg transition-colors"
            >
              {loading ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default CreateGroupModal;
