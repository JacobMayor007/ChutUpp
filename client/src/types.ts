// Existing types
export interface Message {
  message_id?: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
}

export type ChatList = {
  chat_id: string;
  last_message: string;
  last_sender_email: string;
  last_sender_id: string;
  other_user_id: string;
  other_user_email: string;
  created_at: string;
  updated_at: string;
};

export interface UserDB {
  user_id: string;
  email: string;
}

// WebSocket message types
export interface WSMessage {
  type:
    | "message"
    | "typing"
    | "history"
    | "history_message"
    | "result"
    | "error"
    | "call_initiate"
    | "call_answer"
    | "call_reject"
    | "call_end"
    | "ice_candidate";
  content?: any;
  user_id?: string;
  receiver_id?: string;
  created_at?: string;
  // WebRTC specific fields
  call_type?: "video" | "audio";
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  from_email?: string;
}

// WebRTC types
export interface CallState {
  isInCall: boolean;
  callType: "video" | "audio" | null;
  isMuted: boolean;
  isVideoOff: boolean;
  callPartner: string | null;
}

export interface IncomingCall {
  from: string;
  fromEmail: string;
  callType: "video" | "audio";
}
