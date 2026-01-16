import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import type { ChatMessage, ChatList } from "../types";

interface SocketContextType {
  messages: ChatMessage[];
  chatBox: ChatList[];
  isOtherUserTyping: boolean;
  sendChat: (targetId: string | undefined, content: string) => void;
  sendMessage: (targetId: string | undefined, content: string) => void;
  sendTyping: (targetId: string | undefined) => void;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatBox, setChatBox] = useState<ChatList[]>([]);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    // Initialize WebSocket
    const ws = new WebSocket(`ws://localhost:8080/ws?userId=${user.uid}`);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Request initial chat history/list
      ws.send(JSON.stringify({ type: "chat", user_id: user.uid, content: "" }));
    };

    ws.onmessage = (event) => {
      try {
        const incomingMsg: ChatMessage = JSON.parse(event.data);

        if (incomingMsg.type === "typing") {
          setIsOtherUserTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(
            () => setIsOtherUserTyping(false),
            2000
          );
        } else if (incomingMsg.type === "history") {
          setChatBox(incomingMsg.content as unknown as ChatList[]);
        } else {
          setMessages((prev) => [...prev, incomingMsg]);
          setIsOtherUserTyping(false);
        }
      } catch (err) {
        console.error("WebSocket Message Error:", err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log("WebSocket Disconnected");
    };

    return () => ws.close();
  }, [user?.uid]);

  const sendMessage = (targetId: string | undefined, content: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const msg: ChatMessage = {
        type: "message",
        user_id: user?.uid || "",
        receiver_id: targetId || "",
        content: content,
      };

      socketRef.current.send(JSON.stringify(msg));
      setMessages((prev) => [...prev, msg]);
    }
  };

  const sendChat = (targetId: string | undefined, content: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "chat",
          sender_id: user?.uid,
          receiver_id: targetId,
          content: content,
        })
      );
    }
  };

  const sendTyping = (targetId: string | undefined) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "typing",
          receiver_id: targetId,
        })
      );
    }
  };

  return (
    <SocketContext.Provider
      value={{
        messages,
        chatBox,
        isOtherUserTyping,
        sendChat,
        sendMessage,
        sendTyping,
        isConnected,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context)
    throw new Error("useSocket must be used within a SocketProvider");
  return context;
};
