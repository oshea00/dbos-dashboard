import { Link, useParams } from "react-router-dom";
import { useWorkflowDetail } from "../hooks/useWorkflowDetail";
import WorkflowDetail from "../components/workflows/WorkflowDetail";

export default function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { workflow, steps } = useWorkflowDetail(id ?? "");

  if (!id) return <div className="text-red-400">No workflow ID</div>;

  return (
    <div className="space-y-4">
      <div>
        <Link to="/workflows" className="text-blue-400 hover:text-blue-300 text-sm">
          ← Workflow Runs
        </Link>
      </div>

      {workflow.isLoading && (
        <div className="text-gray-500 text-sm py-8 text-center">Loading…</div>
      )}

      {workflow.isError && (
        <div className="text-red-400 text-sm py-4">
          Error loading workflow: {String(workflow.error)}
        </div>
      )}

      {workflow.data && (
        <WorkflowDetail
          workflow={workflow.data}
          steps={steps.data ?? []}
        />
      )}
    </div>
  );
}
