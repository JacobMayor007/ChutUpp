import { Send } from "lucide-react";
import MessageBox from "./InputMessage";
import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";

// The shape of the message matching your Go struct
interface ChatMessage {
  sender_id: string;
  recipient_id: string;
  content: string;
}

export default function Message() {
  const [content, setContent] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setCurrentUserId(currentUser?.uid || "");
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // 1. Connect to Go Backend (passing currentUserId in query params)
    const ws = new WebSocket(`ws://localhost:8080/ws?userId=${currentUserId}`);
    socketRef.current = ws;

    ws.onopen = () => console.log("Connected to Chat Server");

    // 2. Listen for incoming messages from the Hub
    ws.onmessage = (event) => {
      const incomingMsg: ChatMessage = JSON.parse(event.data);
      setMessages((prev) => [...prev, incomingMsg]);
    };

    ws.onclose = () => console.log("Disconnected");

    // Cleanup on unmount
    return () => ws.close();
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId === "f3zZvt8jpCfjCMSxhOs9natVxcn1") {
      setTargetUserId("sFT3hHbbd5OY3Xn7gtN484oIjs22");
    } else {
      setTargetUserId("f3zZvt8jpCfjCMSxhOs9natVxcn1");
    }
  }, [targetUserId]);

  const handleSendMessage = () => {
    if (!content.trim() || !socketRef.current) return;

    const msg: ChatMessage = {
      sender_id: currentUserId,
      recipient_id: targetUserId,
      content: content,
    };

    // 3. Send message to Go ReadPump
    socketRef.current.send(JSON.stringify(msg));

    // Optimistically add to your own UI
    setMessages((prev) => [...prev, msg]);
    setContent("");
  };

  console.log("Current User: ", currentUserId);
  console.log("Target User: ", targetUserId);

  return (
    <div className="bg-[#1c1e21] h-full p-4 rounded-xl flex flex-col">
      <h1 className="text-white font-bold mb-4">
        Chat with User {targetUserId}
      </h1>

      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg max-w-[80%] ${
              m.sender_id === currentUserId
                ? "bg-blue-600 self-end ml-auto"
                : "bg-gray-700 self-start text-white"
            }`}
          >
            <p className="text-white text-sm">{m.content}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <MessageBox
          icon={Send}
          onChangeValue={setContent}
          value={content}
          widthIcon={32}
          heightIcon={32}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
              setContent("");
            }
          }}
          className="h-12 py-2"
        />
        <button
          onClick={handleSendMessage}
          className="absolute right-2 top-2 text-blue-400 hover:text-white transition-colors"
        >
          <Send size={24} />
        </button>
      </div>
    </div>
  );
}
