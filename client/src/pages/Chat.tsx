import { LogOut, MessageCircle, Moon, Sun, ArrowLeft } from "lucide-react";
import ChatBar from "../components/ChatBar";
import Message from "../components/Message";
import { useLogout } from "../hooks/auth/authHooks";
import { useTheme } from "../context/ThemeContext";
import DivBox from "../components/DivBox";
import MyText from "../components/MyText";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { useSocket } from "../context/SocketContext";

export default function Chat() {
  const { logout } = useLogout();
  const { user } = useAuth();
  const { color, setColor } = useTheme();
  const { messages, isOtherUserTyping } = useSocket();
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  return (
    <DivBox className="h-screen flex flex-col px-4 py-4 md:px-10 md:py-6">
      <div className="flex flex-row justify-between items-center mb-4 h-12 shrink-0">
        <div className="md:hidden">
          {mobileView === "chat" ? (
            <div
              onClick={() => setMobileView("list")}
              className="p-2 cursor-pointer active:bg-gray-200 dark:active:bg-gray-700 rounded-full"
            >
              <ArrowLeft size={24} />
            </div>
          ) : (
            <MessageCircle
              onClick={() => setMobileView("chat")}
              className="opacity-50"
            />
          )}
        </div>

        <div className="flex flex-row items-center gap-4 ml-auto">
          <MyText
            label={user?.email}
            size="lg"
            font="sans"
            className="font-bold "
          />

          <DivBox
            onClick={logout}
            className="flex flex-row items-center gap-2 cursor-pointer bg-red-500 px-3 py-1.5 md:px-4 md:py-1.5 rounded-lg active:scale-95 transition-transform"
          >
            <LogOut color="white" size={20} />
            <MyText
              font="sans"
              size="lg"
              label="Sign out"
              className="hidden md:block text-white font-black"
            />
          </DivBox>

          <div
            onClick={() => setColor(color === "light" ? "dark" : "light")}
            className="cursor-pointer active:scale-90 transition-transform p-1"
          >
            {color === "light" ? (
              <Moon color="black" />
            ) : (
              <Sun color="yellow" />
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden h-full ">
        <div
          className={`
            h-full overflow-hidden
            ${mobileView === "list" ? "col-span-12 block" : "hidden"} 
            md:block md:col-span-4 lg:col-span-4
        `}
        >
          <ChatBar setMobileView={setMobileView} />
        </div>

        <div
          className={`
            h-full overflow-hidden
            ${mobileView === "chat" ? "col-span-12 block" : "hidden"} 
            md:block md:col-span-8 lg:col-span-8
        `}
        >
          <Message
            user={user}
            isOtherUserTyping={isOtherUserTyping}
            messages={messages}
          />
        </div>
      </div>
    </DivBox>
  );
}
