import { Link } from "react-router-dom";
import type { WorkflowRun } from "../../types/dbos";
import { formatDuration, formatRelativeTime, truncateId, workflowDurationMs } from "../../lib/format";
import WorkflowStatusBadge from "./WorkflowStatusBadge";

interface Props {
  workflows: WorkflowRun[];
}

export default function WorkflowTable({ workflows }: Props) {
  if (workflows.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        No workflows found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900 text-left">
            <th className="px-4 py-3 text-gray-400 font-medium">Status</th>
            <th className="px-4 py-3 text-gray-400 font-medium">Name</th>
            <th className="px-4 py-3 text-gray-400 font-medium">Workflow ID</th>
            <th className="px-4 py-3 text-gray-400 font-medium">Queue</th>
            <th className="px-4 py-3 text-gray-400 font-medium">Started</th>
            <th className="px-4 py-3 text-gray-400 font-medium">Duration</th>
            <th className="px-4 py-3 text-gray-400 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {workflows.map((wf) => {
            const durationMs = workflowDurationMs(wf);
            const fnName = wf.name.split(".").pop() ?? wf.name;
            return (
              <tr
                key={wf.workflow_id}
                className="border-b border-gray-800 hover:bg-gray-900 transition-colors"
              >
                <td className="px-4 py-3">
                  <WorkflowStatusBadge status={wf.status} />
                </td>
                <td className="px-4 py-3 text-gray-200 font-mono text-xs" title={wf.name}>
                  {fnName}
                </td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs" title={wf.workflow_id}>
                  {truncateId(wf.workflow_id, 16)}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {wf.queue_name ?? <span className="text-gray-600">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {wf.created_at ? formatRelativeTime(wf.created_at) : "—"}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {durationMs != null ? formatDuration(durationMs) : "—"}
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={`/workflows/${wf.workflow_id}`}
                    className="text-blue-400 hover:text-blue-300 text-xs"
                  >
                    Open →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
