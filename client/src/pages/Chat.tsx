import { LogOut, Moon, Sun } from "lucide-react";
import ChatBar from "../components/ChatBar";
import Message from "../components/Message";
import { useLogout } from "../hooks/auth/authHooks";
import { useTheme } from "../context/ThemeContext";
import DivBox from "../components/DivBox";
import MyText from "../components/MyText";
import { useAuth } from "../context/AuthContext";
import { useEffect, useRef, useState } from "react";
import type { ChatMessage, ChatList } from "../types";

export default function Chat() {
  const { logout } = useLogout();
  const { user } = useAuth();
  const { color, setColor } = useTheme();
  const [content, setContent] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatBox, setChatBox] = useState<ChatList[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const [targetUserId, setTargetUserId] = useState("");
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    // 1. Logic Flag: Prevents processing messages if component is dead
    let isUnmounted = false;

    console.log("🚀 Attempting connection...");
    const ws = new WebSocket(`ws://localhost:8080/ws?userId=${user.uid}`);
    socketRef.current = ws;

    ws.onopen = () => {
      // If React unmounted this during the handshake, close it now.
      if (isUnmounted) {
        ws.close();
        return;
      }
      console.log("✅ Connected to Chat Server");
      ws.send(JSON.stringify({ type: "chat", user_id: user.uid, content: "" }));
    };

    ws.onmessage = (event) => {
      if (isUnmounted) return; // Don't update state on a dead component

      const incomingMsg: ChatMessage = JSON.parse(event.data);

      if (incomingMsg.type === "typing") {
        setIsOtherUserTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(
          () => setIsOtherUserTyping(false),
          2000
        );
      } else if (incomingMsg.type === "history") {
        if (Array.isArray(incomingMsg.content)) {
          setChatBox(incomingMsg.content);
        }
      } else {
        setMessages((prev) => [...prev, incomingMsg]);
        setIsOtherUserTyping(false);
      }
    };

    ws.onclose = (e) => {
      console.log("❌ Disconnected:", e.code);
    };

    ws.onerror = (err) => {
      console.error("WebSocket Error:", err);
    };

    // CLEANUP FUNCTION
    return () => {
      isUnmounted = true; // Mark as dead

      // ONLY close if it's already open.
      // If it's still connecting, the onopen guard above will handle the closure.
      if (ws.readyState === WebSocket.OPEN) {
        console.log("🧹 Cleaning up established connection...");
        ws.close();
      }
    };
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid === "f3zZvt8jpCfjCMSxhOs9natVxcn1") {
      setTargetUserId("sFT3hHbbd5OY3Xn7gtN484oIjs22");
    } else {
      setTargetUserId("f3zZvt8jpCfjCMSxhOs9natVxcn1");
    }
  }, [user?.uid]);

  console.log("Other user typing?: ", isOtherUserTyping);

  console.log(chatBox);

  return (
    <DivBox className="h-screen flex flex-col  px-10 py-6 ">
      <div className="flex flex-row justify-end items-center gap-4 mb-4">
        <MyText
          label={user?.email}
          size="lg"
          font="sans"
          className="font-bold"
        />
        <DivBox
          onClick={logout}
          className="flex flex-row items-center gap-4 active:95 cursor-pointer bg-red-500 px-4 py-1.5 rounded-lg"
        >
          <LogOut color="white" />
          <MyText
            font="sans"
            size="lg"
            label="Sign out"
            className="text-right font-sans font-black text-white"
          />
        </DivBox>
        {color === "light" ? (
          <Moon
            color={"black"}
            onClick={() => {
              setColor("dark");
            }}
            className="active:scale-80 hover:cursor-pointer"
          />
        ) : (
          <Sun
            onClick={() => {
              setColor("light");
            }}
            color={"yellow"}
            className="active:scale-80 hover:cursor-pointer"
          />
        )}
      </div>
      <div className="h-full grid grid-cols-12 gap-4 overflow-hidden">
        <div className="col-span-3">
          <ChatBar chatBox={chatBox} />
        </div>
        <div className="col-span-9 h-full overflow-hidden">
          <Message
            user={user}
            content={content}
            setContent={setContent}
            isOtherUserTyping={isOtherUserTyping}
            messages={messages}
            setMessages={setMessages}
            socketRef={socketRef}
            targetUserId={targetUserId}
          />
        </div>
      </div>
    </DivBox>
  );
}
