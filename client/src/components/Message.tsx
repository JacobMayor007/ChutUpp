import { Send } from "lucide-react";
import MessageBox from "./InputMessage";
import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../types";
import type { User } from "firebase/auth";
import { useSocket } from "../context/SocketContext";
import { useChatContext } from "../context/ChatContext";

type MessageProps = {
  user: User | null;
  messages: ChatMessage[]; // Changed from optional to required
  isOtherUserTyping: boolean;
};

export default function Message({
  messages,
  isOtherUserTyping,
  user,
}: MessageProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [content, setContent] = useState("");
  const { sendChat, sendMessage, sendTyping } = useSocket();
  const { otherUser } = useChatContext();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleInputChange = (val: string) => {
    setContent(val);

    sendTyping("iJINQBeJ8Le8YgxfnteIJeLwiJx2");
  };

  const handleSendMessage = () => {
    if (!content?.trim()) return;

    sendMessage("iJINQBeJ8Le8YgxfnteIJeLwiJx2", content);

    sendChat("iJINQBeJ8Le8YgxfnteIJeLwiJx2", content);

    setContent("");
  };

  console.log(otherUser);

  return (
    <div className="bg-[#1c1e21]  h-full p-4 rounded-xl grid grid-rows-12">
      <h1 className="text-white font-bold mb-4 row-span-1">
        Chat with User {otherUser?.email}
      </h1>
      <div className=" space-y-2 mb-4 row-span-10 overflow-y-scroll px-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 rounded-lg max-w-[80%] ${
              m.user_id === user?.uid
                ? "bg-blue-600 self-end ml-auto"
                : "bg-gray-700 self-start text-white"
            }`}
          >
            {typeof m.content === "string" ? (
              <p className="text-white text-sm">{m.content}</p>
            ) : null}
          </div>
        ))}
        {isOtherUserTyping && (
          <p className="text-gray-400 text-xs italic ">
            User {otherUser?.email} is typing...
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
