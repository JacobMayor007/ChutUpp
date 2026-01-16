import React, { createContext, useContext, useState } from "react";
import type { UserDB } from "../types";

type ChatContextProps = {
  otherUser: UserDB | null;
  setOtherUser: (user: UserDB | null) => void;
};

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [otherUser, setOtherUser] = useState<UserDB | null>(null);

  return (
    <ChatContext.Provider value={{ otherUser, setOtherUser }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
