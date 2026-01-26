// types.ts
export type UserDB = {
  user_id: string;
  email: string;
};

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

// This is what we store in state - simplified and consistent
export type Message = {
  message_id?: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at?: string;
};

// WebSocket message types - what comes over the wire
export type WSMessage =
  | { type: "message"; content: string; user_id: string; receiver_id: string }
  | { type: "typing"; user_id: string; receiver_id: string }
  | { type: "error"; content: string }
  | { type: "history"; content: ChatList[] }
  | {
      type: "history_message";
      content: Array<{
        message_id: string;
        content: string;
        current_user: string;
        other_user: string;
        created_at: string;
        updated_at: string;
      }>;
    };
