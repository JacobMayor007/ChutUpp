import { Send, Loader2, Video, Phone } from "lucide-react";
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
import IncomingCallModal from "./IncomingCallModal";
import CallModal from "./CallModal";

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
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const topObserverRef = useRef<HTMLDivElement | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const prevScrollHeightRef = useRef<number>(0);

  const {
    sendMessage,
    sendTyping,
    loadMessageHistory,
    initiateCall,
    isInCall,
    incomingCall,
  } = useSocket();
  const { otherUser } = useChatContext();

  // Handle Scroll Position Maintenance
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const currentScrollHeight = container.scrollHeight;
    const heightDifference = currentScrollHeight - prevScrollHeightRef.current;

    if (heightDifference > 0 && prevScrollHeightRef.current > 0) {
      const isNewMessage =
        messages[messages.length - 1]?.message_id !== lastMessageIdRef.current;

      if (!isNewMessage) {
        container.scrollTop = container.scrollTop + heightDifference;
      }
    }

    prevScrollHeightRef.current = currentScrollHeight;
  }, [messages]);

  // Handle Auto-Scroll to Bottom for New Messages
  useEffect(() => {
    if (!messages.length) return;
    const lastMessage = messages[messages.length - 1];

    const isNewMessage = lastMessage.message_id !== lastMessageIdRef.current;

    if (isNewMessage && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      lastMessageIdRef.current = lastMessage.message_id || "";
    }
  }, [messages]);

  // Infinite Scroll Trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          otherUser?.user_id &&
          messages.length > 0
        ) {
          setIsLoadingHistory(true);
          const oldestTimestamp = messages[0]?.created_at;

          loadMessageHistory(user?.uid, otherUser.user_id, oldestTimestamp);

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

  const handleVideoCall = () => {
    if (otherUser?.user_id) {
      initiateCall(otherUser.user_id, "video");
    }
  };

  const handleAudioCall = () => {
    if (otherUser?.user_id) {
      initiateCall(otherUser.user_id, "audio");
    }
  };

  return (
    <div className="h-full bg-[#1c1e21] rounded-xl flex flex-col relative">
      {/* Incoming Call Modal */}
      {incomingCall && <IncomingCallModal />}

      {/* Active Call Modal */}
      {isInCall && <CallModal />}

      {otherUser?.user_id ? (
        <div className="h-full p-4 grid grid-rows-[auto_1fr_auto] gap-4">
          {/* Header with Call Buttons */}
          <div className="flex items-center justify-between">
            <h1 className="text-white font-bold">
              Chat with User {otherUser?.email}
            </h1>
            <div className="flex gap-2">
              <button
                onClick={handleAudioCall}
                className="p-2 bg-green-600 hover:bg-green-700 rounded-full transition-colors"
                title="Audio Call"
              >
                <Phone className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={handleVideoCall}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
                title="Video Call"
              >
                <Video className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Chat Area */}
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
