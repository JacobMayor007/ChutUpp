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
    const ws = new WebSocket(`ws://localhost:8080/ws?userId=${user?.uid}`);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to Chat Server");
      // 2. IMMEDIATELY request the recent chat list
      ws.send(
        JSON.stringify({
          type: "chat",
          user_id: user?.uid,
          content: "",
        })
      );
    };

    ws.onmessage = (event) => {
      const incomingMsg: ChatMessage = JSON.parse(event.data);
      console.log("Incoming messsages: ", incomingMsg);

      if (incomingMsg.type === "typing") {
        console.log(incomingMsg.content);

        setIsOtherUserTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(
          () => setIsOtherUserTyping(false),
          2000
        );
      } else if (incomingMsg.type === "history") {
        if (typeof incomingMsg.content === "object") {
          const historyData = incomingMsg.content;
          setChatBox(historyData);
        } else {
          console.error(
            "Received history type but content was a string:",
            incomingMsg.content
          );
        }
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

  console.log("Other user typing?: ", isOtherUserTyping);

  console.log("Chat Box", chatBox);

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
        <div className="sm:col-span-5 md:col-span-4 lg:col-span-3">
          <ChatBar chatBox={chatBox} />
        </div>
        <div className="sm:col-span-7 md:col-span-8 lg:col-span-9 h-full overflow-hidden">
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
