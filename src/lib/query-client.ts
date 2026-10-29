import axios from "axios";
import { QueryClient } from "@tanstack/react-query";

export const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false,
      retry: (failures, error) => {
        if (axios.isAxiosError(error) && [400, 401, 403, 404].includes(error.response?.status ?? 0)) return false;
        return failures < 1;
      },
    },
    // Uma escrita nunca é repetida automaticamente depois de falha de rede.
    mutations: { retry: false },
  },
});

export const queryClient = createQueryClient();

export const bolaoKeys = {
  all: ["bolao"] as const,
  games: ["bolao", "games"] as const,
  participants: ["bolao", "participants"] as const,
  predictions: ["bolao", "predictions"] as const,
  results: ["bolao", "results"] as const,
  game: (id: string) => ["bolao", "game", id] as const,
};
