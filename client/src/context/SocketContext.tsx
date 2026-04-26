import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import type { Message, ChatList, WSMessage, UserDB } from "../types";

interface SocketContextType {
  messages: Message[];
  chatBox: ChatList[];
  isOtherUserTyping: boolean;
  isConnected: boolean;
  searchUser: (target: string) => void;
  sendMessage: (receiverId: string | undefined, content: string) => void;
  sendTyping: (receiverId: string | undefined) => void;
  loadMessageHistory: (
    userId: string | undefined,
    receiverId: string | undefined,
    before?: string
  ) => void;
  loadChatHistory: (targetId: string | undefined, content: string) => void;
  resultSearchUser: UserDB[];
  setResultSearchUser: (users: UserDB[]) => void;
  clearResultSearchUser: () => void;
  clearMessages: () => void;
  clearChat: () => void;
  // WebRTC functions
  initiateCall: (receiverId: string, callType: "video" | "audio") => void;
  answerCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  // WebRTC state
  incomingCall: {
    from: string;
    fromEmail: string;
    callType: "video" | "audio";
  } | null;
  isInCall: boolean;
  callType: "video" | "audio" | null;
  isMuted: boolean;
  isVideoOff: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// ICE servers configuration
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatBox, setChatBox] = useState<ChatList[]>([]);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [resultSearchUser, setResultSearchUser] = useState<UserDB[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // WebRTC states
  const [incomingCall, setIncomingCall] = useState<{
    from: string;
    fromEmail: string;
    callType: "video" | "audio";
  } | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [callType, setCallType] = useState<"video" | "audio" | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const currentCallPartnerRef = useRef<string | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  useEffect(() => {
    if (!user?.uid) return;

    const ws = new WebSocket(
      `${import.meta.env.VITE_WEBSOCKET_URL}/ws?userId=${user.uid}`
    );
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log("WebSocket Connected");
      ws.send(
        JSON.stringify({
          type: "chat",
          user_id: user.uid,
          content: "",
        })
      );

      // Start heartbeat - send ping every 40 seconds
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      heartbeatIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 40000);
    };

    ws.onmessage = (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data);
        console.log("📨 Received message:", data);

        handleWebSocketMessage(data);
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log("WebSocket disconnected");
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      cleanupCall();
      ws.close();
    };
  }, [user?.uid]);

  const handleWebSocketMessage = (data: WSMessage) => {
    switch (data.type) {
      case "error":
        console.error("Server error:", data.content);
        alert(`Connection Error: ${data.content}`);
        break;

      case "typing":
        setIsOtherUserTyping(true);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setIsOtherUserTyping(false);
        }, 2000);
        break;

      case "history":
        setChatBox(data.content);
        break;

      case "history_message":
        const formattedMessages: Message[] = data.content.map((msg: any) => ({
          message_id: msg.message_id,
          content: msg.content,
          sender_id: msg.current_user,
          receiver_id: msg.other_user,
          created_at: msg.created_at,
        }));

        setMessages((prev) => {
          if (prev.length === 0) return formattedMessages;

          const newMsg = formattedMessages[0];
          const prevMsg = prev[0];

          const getChatId = (m: Message) =>
            [m.sender_id, m.receiver_id].sort().join("-");

          const newChatId = newMsg ? getChatId(newMsg) : null;
          const prevChatId = prevMsg ? getChatId(prevMsg) : null;

          if (newChatId && prevChatId && newChatId !== prevChatId) {
            return formattedMessages;
          }

          const newIds = new Set(formattedMessages.map((m) => m.message_id));
          const filteredPrev = prev.filter((m) => !newIds.has(m.message_id));

          return [...formattedMessages, ...filteredPrev];
        });
        break;

      case "message":
        const newMessage: Message = {
          content: data.content,
          sender_id: data.user_id || "",
          receiver_id: data.receiver_id || "",
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, newMessage]);
        setIsOtherUserTyping(false);
        break;

      case "result":
        const formattedUsers: UserDB[] = data?.content?.map((data: any) => ({
          user_id: data?.user_id,
          email: data?.email,
        }));
        setResultSearchUser(formattedUsers);
        break;

      // WebRTC signaling messages
      case "call_initiate":
        console.log("📞 Incoming call from:", data.user_id);
        handleIncomingCall(data);
        break;

      case "call_answer":
        console.log("✅ Call answered by:", data.user_id);
        handleCallAnswer(data);
        break;

      case "call_reject":
        console.log("❌ Call rejected");
        handleCallRejected();
        break;

      case "call_end":
        console.log("📴 Call ended");
        handleCallEnded();
        break;

      case "ice_candidate":
        console.log("🧊 ICE candidate received");
        handleIceCandidate(data);
        break;
    }
  };

  // WebRTC Functions
  const initiateCall = async (receiverId: string, type: "video" | "audio") => {
    try {
      console.log(`🚀 Initiating ${type} call to:`, receiverId);

      setCallType(type);
      currentCallPartnerRef.current = receiverId;

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true,
      });

      console.log("🎥 Got local stream:", stream.getTracks());
      setLocalStream(stream);

      // Create peer connection
      const peerConnection = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = peerConnection;

      // Add local stream tracks to peer connection
      stream.getTracks().forEach((track) => {
        console.log("➕ Adding track:", track.kind);
        peerConnection.addTrack(track, stream);
      });

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          console.log("🧊 Sending ICE candidate");
          socketRef.current.send(
            JSON.stringify({
              type: "ice_candidate",
              user_id: user?.uid,
              receiver_id: receiverId,
              candidate: event.candidate,
            })
          );
        }
      };

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log("📺 Received remote track:", event.streams[0]);
        setRemoteStream(event.streams[0]);
      };

      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      console.log("📤 Sending call initiate with offer");

      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        const callMessage = {
          type: "call_initiate",
          user_id: user?.uid,
          receiver_id: receiverId,
          call_type: type,
          offer: offer,
        };

        console.log("📨 Call message:", callMessage);
        socketRef.current.send(JSON.stringify(callMessage));
        console.log("✅ Call initiate sent successfully");
      } else {
        console.error("❌ WebSocket not ready:", socketRef.current?.readyState);
        throw new Error("WebSocket not connected");
      }

      setIsInCall(true);
    } catch (error) {
      console.error("❌ Error initiating call:", error);
      alert("Failed to access camera/microphone: " + error);
      cleanupCall();
    }
  };

  const handleIncomingCall = async (data: any) => {
    console.log("📞 Processing incoming call:", data);

    setIncomingCall({
      from: data.user_id,
      fromEmail: data.from_email || data.user_id,
      callType: data.call_type,
    });
    setCallType(data.call_type);
    currentCallPartnerRef.current = data.user_id;

    // Store the offer for when user answers
    pendingOfferRef.current = data.offer;

    // Create peer connection
    if (!peerConnectionRef.current) {
      const peerConnection = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = peerConnection;

      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          console.log("🧊 Sending ICE candidate (receiver)");
          socketRef.current.send(
            JSON.stringify({
              type: "ice_candidate",
              user_id: user?.uid,
              receiver_id: data.user_id,
              candidate: event.candidate,
            })
          );
        }
      };

      peerConnection.ontrack = (event) => {
        console.log("📺 Received remote track (receiver):", event.streams[0]);
        setRemoteStream(event.streams[0]);
      };

      // Set remote description with the offer
      try {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );
        console.log("✅ Remote description set");
      } catch (error) {
        console.error("❌ Error setting remote description:", error);
      }
    }
  };

  const answerCall = async () => {
    if (!incomingCall || !peerConnectionRef.current) {
      console.error("❌ Cannot answer: no incoming call or peer connection");
      return;
    }

    try {
      console.log("📞 Answering call...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      });

      console.log("🎥 Got local stream:", stream.getTracks());
      setLocalStream(stream);

      // Add local stream tracks
      stream.getTracks().forEach((track) => {
        console.log("➕ Adding track:", track.kind);
        peerConnectionRef.current?.addTrack(track, stream);
      });

      // Create answer
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      console.log("📤 Sending call answer");

      // Send answer
      if (socketRef.current) {
        socketRef.current.send(
          JSON.stringify({
            type: "call_answer",
            user_id: user?.uid,
            receiver_id: incomingCall.from,
            answer: answer,
          })
        );
      }

      setIsInCall(true);
      setIncomingCall(null);
      console.log("✅ Call answered successfully");
    } catch (error) {
      console.error("❌ Error answering call:", error);
      alert("Failed to access camera/microphone: " + error);
      rejectCall();
    }
  };

  const handleCallAnswer = async (data: any) => {
    console.log("✅ Processing call answer");

    console.log(localStream);

    if (peerConnectionRef.current) {
      try {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
        console.log("✅ Remote description set from answer");
      } catch (error) {
        console.error("❌ Error setting remote description:", error);
      }
    }
  };

  const rejectCall = () => {
    console.log("❌ Rejecting call");
    if (incomingCall && socketRef.current) {
      socketRef.current.send(
        JSON.stringify({
          type: "call_reject",
          user_id: user?.uid,
          receiver_id: incomingCall.from,
        })
      );
    }
    setIncomingCall(null);
    cleanupCall();
  };

  const handleCallRejected = () => {
    cleanupCall();
  };

  const endCall = () => {
    console.log("📴 Ending call");
    if (currentCallPartnerRef.current && socketRef.current) {
      socketRef.current.send(
        JSON.stringify({
          type: "call_end",
          user_id: user?.uid,
          receiver_id: currentCallPartnerRef.current,
        })
      );
    }
    cleanupCall();
  };

  const handleCallEnded = () => {
    console.log("📴 Call ended by other party");
    cleanupCall();
  };

  const handleIceCandidate = async (data: any) => {
    if (peerConnectionRef.current && data.candidate) {
      try {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
        console.log("✅ ICE candidate added");
      } catch (error) {
        console.error("❌ Error adding ICE candidate:", error);
      }
    }
  };

  const cleanupCall = () => {
    console.log("🧹 Cleaning up call");

    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
        console.log("⏹️ Stopped track:", track.kind);
      });
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
        }
      });
    }
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Reset states
    setLocalStream(null);
    setRemoteStream(null);
    setIsInCall(false);
    setCallType(null);
    setIncomingCall(null);
    setIsMuted(false);
    setIsVideoOff(false);
    currentCallPartnerRef.current = null;
    pendingOfferRef.current = null;
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        console.log("🔇 Mute toggled:", !audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream && callType === "video") {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
        console.log("📹 Video toggled:", !videoTrack.enabled);
      }
    }
  };

  // Original chat functions
  const sendMessage = (receiverId: string | undefined, content: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not connected");
      return;
    }

    if (!user?.uid || !receiverId) {
      console.error("User not authenticated or receiver not specified");
      return;
    }

    const message: Message = {
      content,
      sender_id: user.uid,
      receiver_id: receiverId,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, message]);

    socketRef.current.send(
      JSON.stringify({
        type: "message",
        user_id: user.uid,
        receiver_id: receiverId,
        content,
      })
    );

    loadChatHistory(receiverId, content);
  };

  const sendTyping = (receiverId: string | undefined) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    if (!receiverId) return;

    socketRef.current.send(
      JSON.stringify({
        type: "typing",
        receiver_id: receiverId,
      })
    );
  };

  const loadMessageHistory = (
    userId: string | undefined,
    receiverId: string | undefined,
    before?: string
  ) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not connected");
      return;
    }

    if (!userId || !receiverId) {
      console.error("User ID or Receiver ID not specified");
      return;
    }

    socketRef.current.send(
      JSON.stringify({
        type: "message_history",
        sender_id: userId,
        receiver_id: receiverId,
        content: before || "",
      })
    );
  };

  const loadChatHistory = (targetId: string | undefined, content: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    socketRef.current.send(
      JSON.stringify({
        type: "chat",
        sender_id: user?.uid,
        receiver_id: targetId,
        content: content,
      })
    );
  };

  const searchUser = useCallback((user: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    socketRef.current.send(JSON.stringify({ type: "search", search: user }));
  }, []);

  const clearResultSearchUser = () => {
    setResultSearchUser([]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const clearChat = () => {
    setChatBox([]);
  };

  return (
    <SocketContext.Provider
      value={{
        messages,
        chatBox,
        resultSearchUser,
        isOtherUserTyping,
        isConnected,
        setResultSearchUser,
        sendMessage,
        sendTyping,
        clearChat,
        loadChatHistory,
        loadMessageHistory,
        clearMessages,
        clearResultSearchUser,
        searchUser,
        // WebRTC
        initiateCall,
        answerCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        incomingCall,
        isInCall,
        callType,
        isMuted,
        isVideoOff,
        localStream,
        remoteStream,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
