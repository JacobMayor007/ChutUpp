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

// Define the two possible shapes of a message
type TextMessage = {
  type: "message" | "typing";
  content: string;
  user_id: string;
  receiver_id: string;
};

type HistoryMessage = {
  type: "history";
  content: string | ChatList[];
  user_id: string;
  receiver_id: string;
};

// The Final Type is a Union of both
export type ChatMessage = TextMessage | HistoryMessage;
