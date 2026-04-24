import { Link } from "react-router-dom";
import type { QueueSummary } from "../../types/dbos";
import { formatDuration, formatRelativeTime } from "../../lib/format";

interface Props {
  queues: QueueSummary[];
}

export default function QueueTable({ queues }: Props) {
  if (queues.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">No queued workflows</div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900 text-left">
            <th className="px-4 py-3 text-gray-400 font-medium">Queue</th>
            <th className="px-4 py-3 text-gray-400 font-medium">Depth</th>
            <th className="px-4 py-3 text-gray-400 font-medium">Oldest Pending</th>
            <th className="px-4 py-3 text-gray-400 font-medium">Running</th>
            <th className="px-4 py-3 text-gray-400 font-medium">Waiting</th>
            <th className="px-4 py-3 text-gray-400 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {queues.map((q) => (
            <tr
              key={q.queue_name}
              className="border-b border-gray-800 hover:bg-gray-900 transition-colors"
            >
              <td className="px-4 py-3 text-gray-200 font-mono text-xs">{q.queue_name}</td>
              <td className="px-4 py-3">
                <span className="text-white font-semibold">{q.depth}</span>
              </td>
              <td className="px-4 py-3 text-gray-400 text-xs">
                {q.oldest_created_at ? (
                  <span title={String(q.oldest_created_at)}>
                    {formatRelativeTime(q.oldest_created_at)}
                    {" "}
                    <span className="text-gray-600">
                      ({formatDuration(Date.now() - q.oldest_created_at)})
                    </span>
                  </span>
                ) : "—"}
              </td>
              <td className="px-4 py-3 text-blue-400 text-sm font-medium">{q.pending_count}</td>
              <td className="px-4 py-3 text-yellow-400 text-sm font-medium">{q.enqueued_count}</td>
              <td className="px-4 py-3">
                <Link
                  to={`/queues/${encodeURIComponent(q.queue_name)}`}
                  className="text-blue-400 hover:text-blue-300 text-xs"
                >
                  View →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
