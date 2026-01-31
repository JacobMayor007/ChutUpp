import {
  LogOut,
  MessageCircle,
  Moon,
  Sun,
  ArrowLeft,
  Video,
  VideoOff,
} from "lucide-react";
import ChatBar from "../components/ChatBar";
import Message from "../components/Message";
import { useLogout } from "../hooks/auth/authHooks";
import { useTheme } from "../context/ThemeContext";
import DivBox from "../components/DivBox";
import MyText from "../components/MyText";
import { useAuth } from "../context/AuthContext";
import { useState, useRef, useEffect } from "react"; // Added useRef
import { useSocket } from "../context/SocketContext";

export default function Chat() {
  const { logout } = useLogout();
  const { user } = useAuth();
  const { color, setColor } = useTheme();
  const { messages, isOtherUserTyping } = useSocket();
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  // Use a ref instead of document.getElementById
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const openVideoHandle = async () => {
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      setStream(localStream);

      if (videoRef.current) {
        videoRef.current.srcObject = localStream;
        // Ensure the video plays once the stream is loaded
        videoRef.current.play();
      }
    } catch (error) {
      console.error("Error accessing media devices.", error);
    }
  };

  const closeVideoHandle = () => {
    if (stream) {
      // 1. Get all tracks (audio and video) and stop them
      stream.getTracks().forEach((track) => {
        track.stop();
      });

      // 2. Clear the state so the video UI disappears
      setStream(null);
    }
  };

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <DivBox className="h-screen flex flex-col px-4 py-4 md:px-10 md:py-6">
      {/* Local Video Preview - Styled to be a floating overlay or hidden if no stream */}
      {stream && (
        <div className="fixed bottom-20 right-10 z-50 border-2 border-blue-500 rounded-lg overflow-hidden w-48 h-36 shadow-xl">
          <video
            ref={videoRef}
            muted
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      )}

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
          {/* Video Toggle Button */}

          {stream ? (
            <VideoOff onClick={closeVideoHandle} />
          ) : (
            <Video onClick={openVideoHandle} />
          )}

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
