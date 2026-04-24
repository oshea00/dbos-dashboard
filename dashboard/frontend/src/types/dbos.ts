export type WorkflowStatusValue =
  | "PENDING"
  | "ENQUEUED"
  | "DELAYED"
  | "SUCCESS"
  | "ERROR"
  | "CANCELLED"
  | "MAX_RECOVERY_ATTEMPTS_EXCEEDED";

export interface WorkflowRun {
  workflow_id: string;
  status: WorkflowStatusValue;
  name: string;
  class_name: string | null;
  queue_name: string | null;
  executor_id: string | null;
  app_version: string | null;
  created_at: number | null;
  updated_at: number | null;
  input: unknown | null;
  output: unknown | null;
  error: string | null;
  forked_from: string | null;
}

export interface WorkflowStep {
  function_id: number;
  function_name: string;
  output: unknown | null;
  error: string | null;
  child_workflow_id: string | null;
  started_at_epoch_ms: number | null;
  completed_at_epoch_ms: number | null;
  duration_ms: number | null;
}

export interface QueueSummary {
  queue_name: string;
  depth: number;
  oldest_created_at: number | null;
  pending_count: number;
  enqueued_count: number;
}

export interface QueueDetail {
  queue_name: string;
  workflows: WorkflowRun[];
}
