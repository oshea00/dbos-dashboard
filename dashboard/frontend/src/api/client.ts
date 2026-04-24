import type { QueueDetail, QueueSummary, WorkflowRun, WorkflowStep } from "../types/dbos";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export interface WorkflowFilters {
  status?: string;
  name?: string;
  queue_name?: string;
  start_time_ms_ago?: number;
  start_time?: string;
  end_time?: string;
  limit?: number;
  offset?: number;
  sort_desc?: boolean;
}

export const api = {
  listWorkflows(filters: WorkflowFilters = {}): Promise<WorkflowRun[]> {
    const qs = new URLSearchParams();
    if (filters.status) qs.set("status", filters.status);
    if (filters.name) qs.set("name", filters.name);
    if (filters.queue_name) qs.set("queue_name", filters.queue_name);
    if (filters.start_time_ms_ago != null) {
      qs.set("start_time", new Date(Date.now() - filters.start_time_ms_ago).toISOString());
    } else if (filters.start_time) {
      qs.set("start_time", filters.start_time);
    }
    if (filters.end_time) qs.set("end_time", filters.end_time);
    if (filters.limit != null) qs.set("limit", String(filters.limit));
    if (filters.offset != null) qs.set("offset", String(filters.offset));
    if (filters.sort_desc != null) qs.set("sort_desc", String(filters.sort_desc));
    return request<WorkflowRun[]>(`/workflows?${qs}`);
  },

  getWorkflow(id: string): Promise<WorkflowRun> {
    return request<WorkflowRun>(`/workflows/${encodeURIComponent(id)}`);
  },

  getWorkflowSteps(id: string): Promise<WorkflowStep[]> {
    return request<WorkflowStep[]>(`/workflows/${encodeURIComponent(id)}/steps`);
  },

  cancelWorkflow(id: string): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>(`/workflows/${encodeURIComponent(id)}/cancel`, { method: "POST" });
  },

  resumeWorkflow(id: string): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>(`/workflows/${encodeURIComponent(id)}/resume`, { method: "POST" });
  },

  forkWorkflow(id: string, startStep: number): Promise<{ ok: boolean; new_workflow_id: string }> {
    return request(`/workflows/${encodeURIComponent(id)}/fork`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start_step: startStep }),
    });
  },

  listQueues(): Promise<QueueSummary[]> {
    return request<QueueSummary[]>("/queues");
  },

  getQueue(name: string, limit = 50, offset = 0): Promise<QueueDetail> {
    return request<QueueDetail>(`/queues/${encodeURIComponent(name)}?limit=${limit}&offset=${offset}`);
  },
};
