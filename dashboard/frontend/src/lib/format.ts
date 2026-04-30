import type { WorkflowRun } from "../types/dbos";

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
}

export function formatRelativeTime(epochMs: number): string {
  const diffMs = Date.now() - epochMs;
  const diffS = Math.floor(diffMs / 1000);
  if (diffS < 60) return `${diffS}s ago`;
  const diffM = Math.floor(diffS / 60);
  if (diffM < 60) return `${diffM}m ago`;
  const diffH = Math.floor(diffM / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

export function formatTimestamp(epochMs: number): string {
  return new Date(epochMs).toLocaleString();
}

export function truncateId(id: string, maxLen: number): string {
  return id.length <= maxLen ? id : `${id.slice(0, maxLen)}…`;
}

export function workflowDurationMs(wf: WorkflowRun): number | null {
  if (wf.created_at == null) return null;
  const end = wf.updated_at ?? (wf.status === "PENDING" || wf.status === "ENQUEUED" || wf.status === "DELAYED" ? Date.now() : null);
  if (end == null) return null;
  return end - wf.created_at;
}
