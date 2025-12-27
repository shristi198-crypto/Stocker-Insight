import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export interface NewsItem {
  id: number;
  title: string;
  summary: string;
  source: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: string;
  relatedStocks: string[] | null;
  category: string;
  createdAt: string | null;
}

export function useNews() {
  return useQuery<NewsItem[]>({
    queryKey: [api.news.list.path],
    queryFn: async () => {
      const res = await fetch(api.news.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch news");
      return res.json();
    },
    refetchInterval: 60000,
  });
}

export function useRefreshNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.news.refresh.path, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to refresh news");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.news.list.path] });
    },
  });
}
