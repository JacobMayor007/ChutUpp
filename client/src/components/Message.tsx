import { Send, Loader2 } from "lucide-react"; // Import Loader2
import MessageBox from "./InputMessage";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Message } from "../types";
import type { User } from "firebase/auth";
import { useSocket } from "../context/SocketContext";
import { useChatContext } from "../context/ChatContext";
import DivBox from "./DivBox";
import MyText from "./MyText";
import Button from "./Button";
import SearchUser from "./SearchUser";

type MessageProps = {
  user: User | null;
  messages: Message[];
  isOtherUserTyping: boolean;
};

export default function Message({
  messages,
  isOtherUserTyping,
  user,
}: MessageProps) {
  const [content, setContent] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false); // Track loading state

  // Refs
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null); // Ref for the scrollable container
  const topObserverRef = useRef<HTMLDivElement | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  // To calculate scroll jump
  const prevScrollHeightRef = useRef<number>(0);

  const { sendMessage, sendTyping, loadMessageHistory } = useSocket();
  const { otherUser } = useChatContext();

  // 1. Handle Scroll Position Maintenance (The "Smooth" Logic)
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Calculate how much the height changed
    const currentScrollHeight = container.scrollHeight;
    const heightDifference = currentScrollHeight - prevScrollHeightRef.current;

    // If height increased (old messages added) AND we weren't at the bottom
    // Shift the scroll position down by the height difference so visual position stays static
    if (heightDifference > 0 && prevScrollHeightRef.current > 0) {
      // Only adjust if we are loading history (not sending new message)
      const isNewMessage =
        messages[messages.length - 1]?.message_id !== lastMessageIdRef.current;

      if (!isNewMessage) {
        container.scrollTop = container.scrollTop + heightDifference;
      }
    }

    prevScrollHeightRef.current = currentScrollHeight;
  }, [messages]);

  // 2. Handle Auto-Scroll to Bottom for New Messages
  useEffect(() => {
    if (!messages.length) return;
    const lastMessage = messages[messages.length - 1];

    // Check if the latest message is actually new (not history)
    const isNewMessage = lastMessage.message_id !== lastMessageIdRef.current;

    if (isNewMessage && messagesEndRef.current) {
      // Simple smooth scroll to bottom for live chat
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      lastMessageIdRef.current = lastMessage.message_id || "";
    }
  }, [messages]);

  // 3. The Infinite Scroll Trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          otherUser?.user_id &&
          messages.length > 0
        ) {
          setIsLoadingHistory(true); // Show spinner
          const oldestTimestamp = messages[0]?.created_at;

          // Slight delay to allow spinner to show (optional UX preference)
          // or just call immediately
          loadMessageHistory(user?.uid, otherUser.user_id, oldestTimestamp);

          // We turn off loading in a useEffect when messages change, or here via timeout
          // Ideally, pass a callback to loadMessageHistory, but for now:
          setTimeout(() => setIsLoadingHistory(false), 1000);
        }
      },
      { threshold: 1.0 }
    );

    if (topObserverRef.current) observer.observe(topObserverRef.current);
    return () => observer.disconnect();
  }, [messages, otherUser, user]);

  const handleInputChange = (val: string) => {
    setContent(val);
    if (otherUser?.user_id) sendTyping(otherUser.user_id);
  };

  const handleSendMessage = () => {
    if (!content?.trim() || !otherUser?.user_id) return;
    sendMessage(otherUser.user_id, content);
    setContent("");
  };

  return (
    <div className="h-full bg-[#1c1e21] rounded-xl flex flex-col">
      {otherUser?.user_id ? (
        <div className="h-full p-4 grid grid-rows-[auto_1fr_auto] gap-4">
          {/* Header */}
          <h1 className="text-white font-bold">
            Chat with User {otherUser?.email}
          </h1>

          {/* Chat Area - Note the ref is on the wrapper now */}
          <div
            ref={scrollContainerRef}
            className="overflow-y-scroll px-4 space-y-2 [overflow-anchor:auto]"
          >
            {/* Loading Spinner */}
            <div
              ref={topObserverRef}
              className="h-4 flex justify-center w-full my-4 py-2"
            >
              {isLoadingHistory && (
                <Loader2 className="animate-spin text-blue-500 w-5 h-5" />
              )}
            </div>

            {messages.map((m, i) => (
              <div
                key={m.message_id || i}
                className={`p-2 rounded-lg max-w-[80%] break-words ${
                  m.sender_id === user?.uid
                    ? "bg-blue-600 self-end ml-auto"
                    : "bg-gray-700 self-start text-white"
                }`}
              >
                <p className="text-white text-sm">{m.content}</p>
              </div>
            ))}

            {isOtherUserTyping && (
              <p className="text-gray-400 text-xs italic ml-2">
                User {otherUser?.email} is typing...
              </p>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="relative">
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
                }
              }}
              className="h-12 py-2"
            />
          </div>
        </div>
      ) : (
        <NoUser />
      )}
    </div>
  );
}

const NoUser = () => {
  const [modal, setModal] = useState("");

  return (
    <DivBox className="h-full bg-[#1c1e21] rounded-4xl flex items-center justify-center">
      {modal === "search" && <SearchUser setModal={setModal} />}

      <DivBox className="bg-transparent w-[380px] xl:w-[500px]">
        <MyText
          font="sans"
          size="4xl"
          label="Select a message in the chat box, or search a user"
          className="text-white text-center"
        />
        <Button
          label="Search a user"
          className="mx-auto mt-10"
          onClick={() => setModal("search")}
        />
      </DivBox>
    </DivBox>
  );
};
