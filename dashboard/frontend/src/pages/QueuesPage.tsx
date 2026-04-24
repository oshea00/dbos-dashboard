import { useParams, Link, useNavigate } from "react-router-dom";
import { useQueues, useQueueDetail } from "../hooks/useQueues";
import QueueTable from "../components/queues/QueueTable";
import WorkflowTable from "../components/workflows/WorkflowTable";

export default function QueuesPage() {
  const { name } = useParams<{ name?: string }>();

  if (name) return <QueueDetailView name={decodeURIComponent(name)} />;
  return <QueueListView />;
}

function QueueListView() {
  const { data, isLoading, isError, error } = useQueues();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Queues</h2>

      {isLoading && <div className="text-gray-500 text-sm py-8 text-center">Loading…</div>}
      {isError && <div className="text-red-400 text-sm py-4">Error: {String(error)}</div>}
      {data && <QueueTable queues={data} />}
    </div>
  );
}

function QueueDetailView({ name }: { name: string }) {
  const { data, isLoading, isError, error } = useQueueDetail(name);

  return (
    <div className="space-y-4">
      <div>
        <Link to="/queues" className="text-blue-400 hover:text-blue-300 text-sm">
          ← Queues
        </Link>
      </div>

      <h2 className="text-xl font-semibold text-white">
        Queue: <span className="font-mono text-blue-300">{name}</span>
      </h2>

      {isLoading && <div className="text-gray-500 text-sm py-8 text-center">Loading…</div>}
      {isError && <div className="text-red-400 text-sm py-4">Error: {String(error)}</div>}
      {data && <WorkflowTable workflows={data.workflows} />}
    </div>
  );
}
