import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import type { Message, ChatList, WSMessage, UserDB } from "../types";

interface SocketContextType {
  messages: Message[];
  chatBox: ChatList[];
  isOtherUserTyping: boolean;
  isConnected: boolean;
  searchUser: (target: string) => void;
  sendMessage: (receiverId: string | undefined, content: string) => void;
  sendTyping: (receiverId: string | undefined) => void;
  loadMessageHistory: (
    userId: string | undefined,
    receiverId: string | undefined,
    before?: string
  ) => void;
  loadChatHistory: (targetId: string | undefined, content: string) => void;
  resultSearchUser: UserDB[];
  setResultSearchUser: (users: UserDB[]) => void;
  clearResultSearchUser: () => void;
  clearMessages: () => void;
  clearChat: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatBox, setChatBox] = useState<ChatList[]>([]);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [resultSearchUser, setResultSearchUser] = useState<UserDB[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const ws = new WebSocket(`ws://localhost:8080/ws?userId=${user.uid}`);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log("WebSocket Connected");
      ws.send(
        JSON.stringify({
          type: "chat",
          user_id: user.uid,
          content: "",
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data);
        console.log(data);

        handleWebSocketMessage(data);
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log("WebSocket disconnected");
    };

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      ws.close();
    };
  }, [user?.uid]);

  const handleWebSocketMessage = (data: WSMessage) => {
    switch (data.type) {
      case "error":
        console.error("Server error:", data.content);
        alert(`Connection Error: ${data.content}`);
        break;

      case "typing":
        setIsOtherUserTyping(true);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setIsOtherUserTyping(false);
        }, 2000);
        break;

      case "history":
        setChatBox(data.content);
        break;

      case "history_message":
        const formattedMessages: Message[] = data.content.map((msg) => ({
          message_id: msg.message_id,
          content: msg.content,
          sender_id: msg.current_user,
          receiver_id: msg.other_user,
          created_at: msg.created_at,
        }));

        setMessages((prev) => {
          // 1. If we have no previous messages, this is a fresh load.
          if (prev.length === 0) return formattedMessages;

          // 2. SAFETY CHECK: Are these messages for the same chat room?
          // We compare the participants of the *incoming* messages vs the *existing* messages.

          const newMsg = formattedMessages[0];
          const prevMsg = prev[0];

          // Helper to create a unique ID for the conversation (e.g., "userA-userB")
          // We sort IDs so that "A talking to B" is the same ID as "B talking to A"
          const getChatId = (m: Message) =>
            [m.sender_id, m.receiver_id].sort().join("-");

          const newChatId = newMsg ? getChatId(newMsg) : null;
          const prevChatId = prevMsg ? getChatId(prevMsg) : null;

          // If the Chat IDs don't match, the user switched chats!
          // We THROW AWAY the old 'prev' and just return the new messages.
          if (newChatId && prevChatId && newChatId !== prevChatId) {
            return formattedMessages;
          }

          // 3. If we are here, it's the same chat (Lazy Loading).
          // Proceed with preventing duplicates and prepending.
          const newIds = new Set(formattedMessages.map((m) => m.message_id));
          const filteredPrev = prev.filter((m) => !newIds.has(m.message_id));

          return [...formattedMessages, ...filteredPrev];
        });
        break;

      case "message":
        const newMessage: Message = {
          content: data.content,
          sender_id: data.user_id,
          receiver_id: data.receiver_id,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, newMessage]);
        setIsOtherUserTyping(false);
        break;

      case "result":
        const formattedUsers: UserDB[] = data?.content?.map((data) => ({
          user_id: data?.user_id,
          email: data?.email,
        }));
        setResultSearchUser(formattedUsers);
    }
  };

  const sendMessage = (receiverId: string | undefined, content: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not connected");
      return;
    }

    if (!user?.uid || !receiverId) {
      console.error("User not authenticated or receiver not specified");
      return;
    }

    const message: Message = {
      content,
      sender_id: user.uid,
      receiver_id: receiverId,
      created_at: new Date().toISOString(),
    };

    // Optimistically add to UI
    setMessages((prev) => [...prev, message]);

    // Send to server
    socketRef.current.send(
      JSON.stringify({
        type: "message",
        user_id: user.uid,
        receiver_id: receiverId,
        content,
      })
    );

    loadChatHistory(receiverId, content);
  };

  const sendTyping = (receiverId: string | undefined) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    if (!receiverId) return;

    socketRef.current.send(
      JSON.stringify({
        type: "typing",
        receiver_id: receiverId,
      })
    );
  };

  const loadMessageHistory = (
    userId: string | undefined,
    receiverId: string | undefined,
    before?: string
  ) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not connected");
      return;
    }

    if (!userId || !receiverId) {
      console.error("User ID or Receiver ID not specified");
      return;
    }

    socketRef.current.send(
      JSON.stringify({
        type: "message_history",
        sender_id: userId,
        receiver_id: receiverId,
        content: before || "",
      })
    );
  };

  const loadChatHistory = (targetId: string | undefined, content: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    socketRef.current.send(
      JSON.stringify({
        type: "chat",
        sender_id: user?.uid,
        receiver_id: targetId,
        content: content,
      })
    );
  };

  const searchUser = useCallback((user: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    socketRef.current.send(JSON.stringify({ type: "search", search: user }));
  }, []);

  const clearResultSearchUser = () => {
    setResultSearchUser([]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const clearChat = () => {
    setChatBox([]);
  };

  return (
    <SocketContext.Provider
      value={{
        messages,
        chatBox,
        resultSearchUser,
        isOtherUserTyping,
        isConnected,
        setResultSearchUser,
        sendMessage,
        sendTyping,
        clearChat,
        loadChatHistory,
        loadMessageHistory,
        clearMessages,
        clearResultSearchUser,
        searchUser,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
