import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export function useWorkflowDetail(id: string) {
  const workflow = useQuery({
    queryKey: ["workflow", id],
    queryFn: () => api.getWorkflow(id),
    refetchInterval: 5000,
    staleTime: 3000,
    enabled: Boolean(id),
  });

  const steps = useQuery({
    queryKey: ["workflow-steps", id],
    queryFn: () => api.getWorkflowSteps(id),
    refetchInterval: 5000,
    staleTime: 3000,
    enabled: Boolean(id),
  });

  return { workflow, steps };
}
