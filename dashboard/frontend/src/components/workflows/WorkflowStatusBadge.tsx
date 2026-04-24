import clsx from "clsx";
import type { WorkflowStatusValue } from "../../types/dbos";

const STATUS: Record<WorkflowStatusValue, { label: string; cls: string }> = {
  SUCCESS: { label: "Success", cls: "bg-green-900 text-green-300 border-green-700" },
  ERROR: { label: "Error", cls: "bg-red-900 text-red-300 border-red-700" },
  PENDING: { label: "Running", cls: "bg-blue-900 text-blue-300 border-blue-700" },
  ENQUEUED: { label: "Queued", cls: "bg-yellow-900 text-yellow-300 border-yellow-700" },
  DELAYED: { label: "Delayed", cls: "bg-purple-900 text-purple-300 border-purple-700" },
  CANCELLED: { label: "Cancelled", cls: "bg-gray-700 text-gray-300 border-gray-600" },
  MAX_RECOVERY_ATTEMPTS_EXCEEDED: { label: "Max Retries", cls: "bg-orange-900 text-orange-300 border-orange-700" },
};

export default function WorkflowStatusBadge({ status }: { status: WorkflowStatusValue }) {
  const cfg = STATUS[status] ?? { label: status, cls: "bg-gray-700 text-gray-300 border-gray-600" };
  return (
    <span className={clsx("px-2 py-0.5 rounded text-xs font-medium border", cfg.cls)}>
      {cfg.label}
    </span>
  );
}
