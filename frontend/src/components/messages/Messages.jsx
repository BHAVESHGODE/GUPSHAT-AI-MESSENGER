import { useEffect, useRef } from "react";
import useGetMessages from "../../hooks/useGetMessages";
import MessageSkeleton from "../skeletons/MessageSkeleton";
import Message from "./Message";
import useListenMessages from "../../hooks/useListenMessages";
import useConversation from "../../zustand/useConversation";
import Avatar from "../Avatar";

const Messages = ({ isPartnerTyping, onOpenLightbox }) => {
  const { messages, messageSearchQuery, selectedConversation } = useConversation();
  const { loading } = useGetMessages();
  useListenMessages();

  const containerRef = useRef(null);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
    const t1 = setTimeout(scrollToBottom, 50);
    const t2 = setTimeout(scrollToBottom, 200);
    const t3 = setTimeout(scrollToBottom, 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [messages, isPartnerTyping, selectedConversation]);

  const filteredMessages = (messages || []).filter((msg) =>
    (msg.message || "").toLowerCase().includes((messageSearchQuery || "").toLowerCase()) ||
    (msg.fileName || "").toLowerCase().includes((messageSearchQuery || "").toLowerCase())
  );

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto relative z-0 py-4 px-4 min-h-0 scroll-smooth">
      {/* Dotted grid wallpaper */}
      <div className="chat-wallpaper" />

      {/* Messages Feed Content */}
      <div className="relative z-0 space-y-2">
        {loading && [...Array(3)].map((_, idx) => <MessageSkeleton key={idx} />)}

        {!loading && filteredMessages.length > 0 &&
          filteredMessages.map((message) => (
            <div key={message._id}>
              <Message message={message} onOpenLightbox={onOpenLightbox} />
            </div>
          ))}

        {/* Typing Bubble */}
        {!loading && isPartnerTyping && (
          <div className="chat chat-start my-2">
            <div className="chat-image avatar">
              <Avatar
                src={selectedConversation?.profilePic}
                name={selectedConversation?.fullName}
                className="w-8 h-8"
              />
            </div>
            <div className="chat-bubble bg-white/5 backdrop-blur-md border border-white/10 text-gray-400 rounded-2xl rounded-tl-sm px-4 py-2 text-xs flex items-center gap-1">
              <span>typing</span>
              <span className="animate-bounce">.</span>
              <span className="animate-bounce delay-100">.</span>
              <span className="animate-bounce delay-200">.</span>
            </div>
          </div>
        )}

        {!loading && filteredMessages.length === 0 && (
          <p className="text-center text-xs text-slate-400 py-8">
            {messageSearchQuery ? "No matching messages found" : "Send a message to start the conversation"}
          </p>
        )}
      </div>
    </div>
  );
};

export default Messages;
