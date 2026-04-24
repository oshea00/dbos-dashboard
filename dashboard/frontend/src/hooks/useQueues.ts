import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export function useQueues() {
  return useQuery({
    queryKey: ["queues"],
    queryFn: () => api.listQueues(),
    refetchInterval: 5000,
    staleTime: 3000,
  });
}

export function useQueueDetail(name: string) {
  return useQuery({
    queryKey: ["queue", name],
    queryFn: () => api.getQueue(name),
    refetchInterval: 5000,
    staleTime: 3000,
    enabled: Boolean(name),
  });
}
