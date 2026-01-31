import { Phone, PhoneOff, Video } from "lucide-react";
import { useSocket } from "../context/SocketContext";

export default function IncomingCallModal() {
  const { incomingCall, answerCall, rejectCall } = useSocket();

  if (!incomingCall) return null;

  console.log(incomingCall);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center">
      <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Caller Info */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
            {incomingCall.callType === "video" ? (
              <Video className="w-12 h-12 text-white" />
            ) : (
              <Phone className="w-12 h-12 text-white" />
            )}
          </div>
          <h2 className="text-white text-2xl font-bold mb-2">
            Incoming {incomingCall.callType === "video" ? "Video" : "Audio"}{" "}
            Call
          </h2>
          <p className="text-gray-300 text-lg">{incomingCall.fromEmail}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          {/* Reject Call */}
          <button
            onClick={rejectCall}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
          >
            <PhoneOff className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">Decline</span>
          </button>

          {/* Accept Call */}
          <button
            onClick={answerCall}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-full transition-colors animate-pulse"
          >
            <Phone className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
}
