import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type WorkflowFilters } from "../api/client";

export function useWorkflows(filters: WorkflowFilters = {}) {
  return useQuery({
    queryKey: ["workflows", filters],
    queryFn: () => api.listWorkflows(filters),
    refetchInterval: 5000,
    staleTime: 3000,
  });
}

export function useWorkflowActions() {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["workflows"] });
    qc.invalidateQueries({ queryKey: ["workflow"] });
  };

  const cancel = useMutation({
    mutationFn: (id: string) => api.cancelWorkflow(id),
    onSuccess: invalidate,
  });

  const resume = useMutation({
    mutationFn: (id: string) => api.resumeWorkflow(id),
    onSuccess: invalidate,
  });

  const fork = useMutation({
    mutationFn: ({ id, startStep }: { id: string; startStep: number }) =>
      api.forkWorkflow(id, startStep),
    onSuccess: invalidate,
  });

  return { cancel, resume, fork };
}
