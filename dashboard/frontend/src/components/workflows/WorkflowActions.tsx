import { useState } from "react";
import clsx from "clsx";
import type { WorkflowRun, WorkflowStep } from "../../types/dbos";
import { useWorkflowActions } from "../../hooks/useWorkflows";

const CANCELLABLE = new Set(["PENDING", "ENQUEUED", "DELAYED"]);
const RESUMABLE = new Set(["ERROR", "CANCELLED", "MAX_RECOVERY_ATTEMPTS_EXCEEDED"]);

interface Props {
  workflow: WorkflowRun;
  steps: WorkflowStep[];
}

export default function WorkflowActions({ workflow, steps }: Props) {
  const { cancel, resume, fork } = useWorkflowActions();
  const [forkStep, setForkStep] = useState<number | null>(null);
  const [showForkDialog, setShowForkDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstFailedStep = steps.find((s) => s.error);
  const defaultForkStep = firstFailedStep?.function_id ?? steps[steps.length - 1]?.function_id ?? 1;

  const handleCancel = async () => {
    if (!window.confirm(`Cancel workflow ${workflow.workflow_id}?`)) return;
    try {
      await cancel.mutateAsync(workflow.workflow_id);
    } catch (e) {
      setError(String(e));
    }
  };

  const handleResume = async () => {
    if (!window.confirm(`Resume workflow ${workflow.workflow_id}?`)) return;
    try {
      await resume.mutateAsync(workflow.workflow_id);
    } catch (e) {
      setError(String(e));
    }
  };

  const handleFork = async () => {
    const step = forkStep ?? defaultForkStep;
    try {
      const result = await fork.mutateAsync({ id: workflow.workflow_id, startStep: step });
      setShowForkDialog(false);
      alert(`Forked → new workflow ID: ${result.new_workflow_id}`);
    } catch (e) {
      setError(String(e));
    }
  };

  const busy = cancel.isPending || resume.isPending || fork.isPending;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={handleCancel}
        disabled={busy || !CANCELLABLE.has(workflow.status)}
        className={clsx(
          "px-3 py-1.5 rounded text-sm font-medium transition-colors",
          CANCELLABLE.has(workflow.status) && !busy
            ? "bg-red-800 hover:bg-red-700 text-red-200"
            : "bg-gray-800 text-gray-600 cursor-not-allowed"
        )}
      >
        Cancel
      </button>

      <button
        onClick={handleResume}
        disabled={busy || !RESUMABLE.has(workflow.status)}
        className={clsx(
          "px-3 py-1.5 rounded text-sm font-medium transition-colors",
          RESUMABLE.has(workflow.status) && !busy
            ? "bg-green-800 hover:bg-green-700 text-green-200"
            : "bg-gray-800 text-gray-600 cursor-not-allowed"
        )}
      >
        Resume
      </button>

      <button
        onClick={() => {
          setForkStep(defaultForkStep);
          setShowForkDialog(true);
        }}
        disabled={busy || steps.length === 0}
        className={clsx(
          "px-3 py-1.5 rounded text-sm font-medium transition-colors",
          steps.length > 0 && !busy
            ? "bg-blue-800 hover:bg-blue-700 text-blue-200"
            : "bg-gray-800 text-gray-600 cursor-not-allowed"
        )}
      >
        Fork
      </button>

      {error && (
        <span className="text-red-400 text-xs ml-2">
          {error}{" "}
          <button onClick={() => setError(null)} className="underline">dismiss</button>
        </span>
      )}

      {showForkDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-96 space-y-4">
            <h3 className="text-white font-semibold">Fork Workflow</h3>
            <p className="text-gray-400 text-sm">
              Start a new execution from a specific step. Steps before the chosen step are not re-executed.
            </p>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Start from step</label>
              <select
                value={forkStep ?? defaultForkStep}
                onChange={(e) => setForkStep(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
              >
                {steps.map((s) => (
                  <option key={s.function_id} value={s.function_id}>
                    #{s.function_id} — {s.function_name}
                    {s.error ? " ✗" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowForkDialog(false)}
                className="px-3 py-1.5 rounded text-sm bg-gray-800 hover:bg-gray-700 text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleFork}
                disabled={fork.isPending}
                className="px-3 py-1.5 rounded text-sm bg-blue-600 hover:bg-blue-500 text-white"
              >
                {fork.isPending ? "Forking…" : "Fork"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
