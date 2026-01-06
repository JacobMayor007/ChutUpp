import { Send } from "lucide-react";
import MessageBox from "./InputMessage";
import { useState, useEffect, useRef } from "react";

import { useAuth } from "../context/AuthContext";

interface ChatMessage {
  type: string;
  sender_id: string;
  recipient_id: string;
  content: string;
}

export default function Message() {
  const [content, setContent] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const { user } = useAuth();
  const [targetUserId, setTargetUserId] = useState("");
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8080/ws?userId=${user?.uid}`);
    socketRef.current = ws;

    ws.onopen = () => console.log("Connected to Chat Server");

    ws.onmessage = (event) => {
      const incomingMsg: ChatMessage = JSON.parse(event.data);
      console.log("Incoming Message:", incomingMsg);

      if (incomingMsg.type === "typing") {
        setIsOtherUserTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(
          () => setIsOtherUserTyping(false),
          2000
        );
      } else {
        setMessages((prev) => [...prev, incomingMsg]);
        setIsOtherUserTyping(false);
      }
    };

    ws.onclose = () => console.log("Disconnected");

    return () => ws.close();
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid === "f3zZvt8jpCfjCMSxhOs9natVxcn1") {
      setTargetUserId("sFT3hHbbd5OY3Xn7gtN484oIjs22");
    } else {
      setTargetUserId("f3zZvt8jpCfjCMSxhOs9natVxcn1");
    }
  }, [user?.uid]);

  const handleInputChange = (val: string) => {
    setContent(val);

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "typing",
          sender_id: user?.uid,
          recipient_id: targetUserId,
          content: "",
        })
      );
    }
  };

  const handleSendMessage = () => {
    if (!content.trim() || !socketRef.current) return;

    const msg: ChatMessage = {
      type: "",
      sender_id: user?.uid || "",
      recipient_id: targetUserId,
      content: content,
    };

    socketRef.current.send(JSON.stringify(msg));

    setMessages((prev) => [...prev, msg]);
    setContent("");
  };

  return (
    <div className="bg-[#1c1e21]  h-full p-4 rounded-xl grid grid-rows-12">
      <h1 className="text-white font-bold mb-4 row-span-1">
        Chat with User {targetUserId}
      </h1>
      <div className=" space-y-2 mb-4 row-span-10 overflow-y-scroll">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg max-w-[80%] ${
              m.sender_id === user?.uid
                ? "bg-blue-600 self-end ml-auto"
                : "bg-gray-700 self-start text-white"
            }`}
          >
            <p className="text-white text-sm">{m.content}</p>
          </div>
        ))}
        {isOtherUserTyping && (
          <p className="text-gray-400 text-xs italic ">
            User {targetUserId} is typing...
          </p>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="relative row-span-1">
        <MessageBox
          icon={Send}
          onChangeValue={handleInputChange}
          value={content}
          widthIcon={32}
          heightIcon={32}
          onClick={handleSendMessage}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
              setContent("");
            }
          }}
          className="h-12 py-2"
        />
      </div>
    </div>
  );
}
