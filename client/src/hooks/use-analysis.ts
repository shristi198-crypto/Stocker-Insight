import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useLocation } from "wouter";

export function useAnalyses() {
  return useQuery({
    queryKey: [api.analyze.list.path],
    queryFn: async () => {
      const res = await fetch(api.analyze.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch analyses");
      return api.analyze.list.responses[200].parse(await res.json());
    },
  });
}

export function useAnalysis(id: number) {
  return useQuery({
    queryKey: [api.analyze.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.analyze.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch analysis");
      return api.analyze.get.responses[200].parse(await res.json());
    },
    enabled: !isNaN(id),
  });
}

export function useCreateAnalysis() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async (symbol: string) => {
      // Validate input using the schema defined in routes (though we pass object to fetch)
      const data = { symbol };
      const validated = api.analyze.create.input.parse(data);
      
      const res = await fetch(api.analyze.create.path, {
        method: api.analyze.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        // Try to parse error if available
        try {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to analyze stock");
        } catch (e) {
          throw new Error("Failed to analyze stock. Server might be busy.");
        }
      }

      return api.analyze.create.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.analyze.list.path] });
      setLocation(`/analysis/${data.id}`);
    },
  });
}
