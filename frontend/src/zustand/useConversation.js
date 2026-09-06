import { create } from "zustand";

const useConversation = create((set) => ({
  selectedConversation: null,
  setSelectedConversation: (selectedConversation) => set({ selectedConversation }),
  activeCharacterId: "kabir",
  setActiveCharacterId: (activeCharacterId) => set({ activeCharacterId }),
  messages: [],
  setMessages: (updater) =>
    set((state) => ({
      messages: typeof updater === "function" ? updater(state.messages) : updater,
    })),
  searchQuery: "",
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  messageSearchQuery: "",
  setMessageSearchQuery: (messageSearchQuery) => set({ messageSearchQuery }),
  conversations: [],
  setConversations: (updater) =>
    set((state) => ({
      conversations: typeof updater === "function" ? updater(state.conversations) : updater,
    })),
  bumpConversation: (id, patch) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        String(c._id) === String(id) ? { ...c, ...patch } : c
      ),
    })),
  groups: [],
  setGroups: (updater) =>
    set((state) => ({
      groups: typeof updater === "function" ? updater(state.groups) : updater,
    })),
  bumpGroup: (id, patch) =>
    set((state) => ({
      groups: state.groups.map((g) =>
        String(g._id) === String(id) ? { ...g, ...patch } : g
      ),
    })),
  replyingTo: null,
  setReplyingTo: (replyingTo) => set({ replyingTo }),
  editingMessage: null,
  setEditingMessage: (editingMessage) => set({ editingMessage }),
  updateMessageInState: (updatedMsg) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === updatedMsg._id ? { ...m, ...updatedMsg } : m
      ),
    })),
  removeMessageFromState: (messageId) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === messageId
          ? { ...m, isDeleted: true, message: "This message was deleted", fileUrl: "", fileType: "" }
          : m
      ),
    })),
}));

export default useConversation;