import clsx from "clsx";
import { useState } from "react";
import type { WorkflowRun, WorkflowStep } from "../../types/dbos";
import { formatDuration } from "../../lib/format";
import JsonViewer from "../common/JsonViewer";

interface Props {
  workflow: WorkflowRun;
  steps: WorkflowStep[];
}

export default function WorkflowTimeline({ workflow, steps }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (steps.length === 0) {
    return <div className="text-gray-500 text-sm py-8 text-center">No steps recorded yet</div>;
  }

  const start = workflow.created_at ?? 0;
  const end = Math.max(
    workflow.updated_at ?? Date.now(),
    ...steps.map((s) => s.completed_at_epoch_ms ?? s.started_at_epoch_ms ?? start),
    Date.now()
  );
  const totalMs = Math.max(end - start, 1);

  return (
    <div className="space-y-1 mt-4">
      {/* Header row */}
      <div className="flex items-center gap-3 text-xs text-gray-500 pb-2 border-b border-gray-800">
        <div className="w-48 text-right">Step</div>
        <div className="flex-1">Timeline</div>
        <div className="w-16 text-right">Duration</div>
      </div>

      {steps.map((step) => {
        const stepStart = step.started_at_epoch_ms ?? start;
        const stepEnd = step.completed_at_epoch_ms ?? (step.error ? stepStart : Date.now());
        const leftPct = ((stepStart - start) / totalMs) * 100;
        const widthPct = Math.max(((stepEnd - stepStart) / totalMs) * 100, 0.5);
        const isError = Boolean(step.error);
        const isRunning = !step.completed_at_epoch_ms && !step.error;

        const shortName = step.function_name.split(".").pop() ?? step.function_name;

        return (
          <div key={step.function_id}>
            <button
              onClick={() => setExpanded(expanded === step.function_id ? null : step.function_id)}
              className="w-full flex items-center gap-3 py-1.5 hover:bg-gray-900 rounded px-1 text-left transition-colors"
            >
              <div className="w-48 text-xs text-gray-400 truncate text-right" title={step.function_name}>
                <span className="text-gray-600 mr-1">#{step.function_id}</span>
                {shortName}
              </div>
              <div className="flex-1 relative h-5 bg-gray-800 rounded overflow-hidden">
                <div
                  className={clsx(
                    "absolute top-0 h-full rounded transition-all",
                    isError
                      ? "bg-red-600"
                      : isRunning
                      ? "bg-blue-500 animate-pulse"
                      : "bg-green-600"
                  )}
                  style={{
                    left: `${leftPct.toFixed(2)}%`,
                    width: `${widthPct.toFixed(2)}%`,
                  }}
                />
              </div>
              <div className="w-16 text-xs text-gray-500 text-right shrink-0">
                {step.duration_ms != null
                  ? formatDuration(step.duration_ms)
                  : isRunning
                  ? "running"
                  : "—"}
              </div>
            </button>

            {expanded === step.function_id && (
              <div className="ml-52 pl-4 py-2 border-l border-gray-700 space-y-2">
                {step.error ? (
                  <JsonViewer value={step.error} label="Error" />
                ) : (
                  <JsonViewer value={step.output} label="Output" />
                )}
                {step.child_workflow_id && (
                  <div className="text-xs text-gray-500">
                    Child workflow:{" "}
                    <a
                      href={`/workflows/${step.child_workflow_id}`}
                      className="text-blue-400 hover:underline font-mono"
                    >
                      {step.child_workflow_id}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
