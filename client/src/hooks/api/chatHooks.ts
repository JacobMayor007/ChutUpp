// src/hooks/useChat.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "../../service/apiService";
import type { Chat } from "../../types";

export function useChat(userId: string | null | undefined) {
  return useQuery<Chat>({
    queryKey: ["chat", userId],
    queryFn: () => api.getChat(userId),
    enabled: !!userId,
  });
}
