import { Send } from "lucide-react";
import MessageBox from "./InputMessage";
import { useEffect, useRef } from "react";
import type { ChatMessage } from "../types";
import type { User } from "firebase/auth";

type MessageProps = {
  user: User | null;
  content: string; // Changed from optional to required for easier handling
  setContent: (content: string) => void;
  messages: ChatMessage[]; // Changed from optional to required
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>; // 2. Correct State Setter Type
  socketRef: React.RefObject<WebSocket | null>;
  targetUserId: string;
  isOtherUserTyping: boolean;
};

export default function Message({
  content,
  setContent,
  messages,
  socketRef,
  targetUserId,
  setMessages,
  isOtherUserTyping,
  user,
}: MessageProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleInputChange = (val: string) => {
    setContent(val);

    if (
      socketRef?.current &&
      socketRef?.current.readyState === WebSocket.OPEN
    ) {
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
    if (!content?.trim() || !socketRef?.current) return;

    const msg: ChatMessage = {
      type: "message",
      user_id: user?.uid || "",
      receiver_id: targetUserId,
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
              m.user_id === user?.uid
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
