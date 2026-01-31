import { useEffect, useRef } from "react";
import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { useSocket } from "../context/SocketContext";
import { useChatContext } from "../context/ChatContext";

export default function CallModal() {
  const {
    endCall,
    toggleMute,
    toggleVideo,
    callType,
    isMuted,
    isVideoOff,
    localStream,
    remoteStream,
  } = useSocket();

  const { otherUser } = useChatContext();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null); // ADD THIS for audio calls

  // Set up local video/audio stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Set up remote video/audio stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream && callType === "video") {
      remoteVideoRef.current.srcObject = remoteStream;
    }

    // ADD THIS: For audio calls, attach to audio element
    if (remoteAudioRef.current && remoteStream && callType === "audio") {
      remoteAudioRef.current.srcObject = remoteStream;
      console.log("🔊 Remote audio stream attached");
    }
  }, [remoteStream, callType]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      <div className="w-full h-full relative flex flex-col">
        {/* Header */}
        <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 px-4 py-2 rounded-lg">
          <h2 className="text-white font-semibold">
            {callType === "video" ? "Video" : "Audio"} Call with{" "}
            {otherUser?.email}
          </h2>
        </div>

        {/* Video Container */}
        <div className="flex-1 relative">
          {/* Remote Video (Main) */}
          {callType === "video" ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{
                transform: "scaleX(-1)",
                WebkitTransform: "scaleX(-1)",
              }}
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              {/* Audio Call UI */}
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <div className="text-center">
                  <div className="w-32 h-32 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white text-5xl font-bold">
                      {otherUser?.email?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <p className="text-white text-xl">{otherUser?.email}</p>
                  <p className="text-gray-400 mt-2">Audio Call</p>
                </div>
              </div>

              {/* Hidden Audio Element for Audio Calls - THIS IS CRUCIAL! */}
              <audio
                ref={remoteAudioRef}
                autoPlay
                playsInline
                style={{ display: "none" }}
              />
            </>
          )}

          {/* Local Video (Picture-in-Picture) */}
          {callType === "video" && (
            <div className="absolute bottom-24 right-4 w-48 h-36 bg-gray-900 rounded-lg overflow-hidden border-2 border-white shadow-lg">
              {/* Always keep the video tag in the DOM, just hide/show it */}
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform scale-x-[-1] ${
                  isVideoOff ? "hidden" : "block"
                }`}
              />

              {/* Show the placeholder when video is off */}
              {isVideoOff && (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <VideoOff className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 bg-black bg-opacity-50 px-6 py-4 rounded-full">
          {/* Mute/Unmute */}
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-colors ${
              isMuted
                ? "bg-red-600 hover:bg-red-700"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </button>

          {/* Video On/Off (only for video calls) */}
          {callType === "video" && (
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-colors ${
                isVideoOff
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
              title={isVideoOff ? "Turn On Video" : "Turn Off Video"}
            >
              {isVideoOff ? (
                <VideoOff className="w-6 h-6 text-white" />
              ) : (
                <Video className="w-6 h-6 text-white" />
              )}
            </button>
          )}

          {/* End Call */}
          <button
            onClick={endCall}
            className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
