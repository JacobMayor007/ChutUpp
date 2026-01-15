export type Chat = {
  chat_id: string;
  last_message: string;
  last_sender_email: string;
  last_sender_id: string;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  type: string;
  user_id: string;
  receiver_id: string;
  content: string;
};
