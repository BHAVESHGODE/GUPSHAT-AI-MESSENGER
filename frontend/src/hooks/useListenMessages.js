import { useEffect, useRef } from "react";
import { useSocketContext } from "../context/SocketContext";
import { useAuthContext } from "../context/AuthContext";
import useConversation from "../zustand/useConversation";
import { requestNotificationPermission, showDesktopNotification } from "../utils/notification";
import notificationSound from "../assets/sounds/notification.mp3";

const useListenMessages = () => {
  const { socket } = useSocketContext();
  const { authUser } = useAuthContext();
  const { setMessages, selectedConversation, updateMessageInState, removeMessageFromState } = useConversation();
  const markAsReadRef = useRef(false);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (!socket) return;
    markAsReadRef.current = false;

    const handleNewMessage = (newMessage) => {
      newMessage.shouldShake = true;
      const sound = new Audio(notificationSound);
      sound.play().catch(() => {});

      const senderId = typeof newMessage.senderId === "object" ? newMessage.senderId._id : newMessage.senderId;
      const receiverId = typeof newMessage.receiverId === "object" ? newMessage.receiverId._id : newMessage.receiverId;
      const msgGroupId = typeof newMessage.groupId === "object" ? newMessage.groupId._id : newMessage.groupId;

      let isForCurrentConversation = false;
      if (selectedConversation) {
        if (selectedConversation.isGroup || selectedConversation.groupId) {
          isForCurrentConversation = Boolean(msgGroupId && msgGroupId === selectedConversation._id);
        } else {
          isForCurrentConversation = Boolean(
            selectedConversation._id === senderId ||
            selectedConversation._id === receiverId
          );
        }
      }

      if (isForCurrentConversation) {
        if (!markAsReadRef.current && senderId === selectedConversation._id) {
          socket.emit("markAsRead", { senderId: authUser._id, receiverId: selectedConversation._id });
          markAsReadRef.current = true;
          newMessage.isRead = true;
        }

        setMessages((prev) =>
          prev.some((m) => m._id === newMessage._id) ? prev : [...prev, newMessage]
        );
      }

      // Show native desktop notification if window is blurred/hidden
      if (document.hidden) {
        const senderName = typeof newMessage.senderId === "object" ? newMessage.senderId.fullName : "GuppShup Contact";
        showDesktopNotification({
          title: `New message from ${senderName}`,
          body: newMessage.message || newMessage.fileName || "Media Attachment",
          icon: typeof newMessage.senderId === "object" ? newMessage.senderId.profilePic : undefined,
        });
      }
    };

    const handleMessagesRead = ({ readerId }) => {
      if (selectedConversation?._id === readerId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.receiverId === readerId) {
              return { ...m, isRead: true };
            }
            return m;
          })
        );
      }
    };

    const handleMessageReactionUpdated = ({ messageId, reactions }) => {
      updateMessageInState({ _id: messageId, reactions });
    };

    const handleMessageEdited = (editedMsg) => {
      updateMessageInState(editedMsg);
    };

    const handleMessageDeleted = ({ messageId }) => {
      removeMessageFromState(messageId);
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("messageReactionUpdated", handleMessageReactionUpdated);
    socket.on("messageEdited", handleMessageEdited);
    socket.on("messageDeleted", handleMessageDeleted);

    if (selectedConversation && !markAsReadRef.current) {
      socket.emit("markAsRead", { senderId: authUser._id, receiverId: selectedConversation._id });
      markAsReadRef.current = true;
    }

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("messageReactionUpdated", handleMessageReactionUpdated);
      socket.off("messageEdited", handleMessageEdited);
      socket.off("messageDeleted", handleMessageDeleted);
    };
  }, [socket, setMessages, selectedConversation, authUser, updateMessageInState, removeMessageFromState]);
};

export default useListenMessages;