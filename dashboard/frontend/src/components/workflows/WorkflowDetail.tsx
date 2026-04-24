import { useState } from "react";
import clsx from "clsx";
import type { WorkflowRun, WorkflowStep } from "../../types/dbos";
import { formatDuration, formatTimestamp, truncateId, workflowDurationMs } from "../../lib/format";
import WorkflowStatusBadge from "./WorkflowStatusBadge";
import WorkflowTimeline from "./WorkflowTimeline";
import WorkflowGraph from "./WorkflowGraph";
import WorkflowActions from "./WorkflowActions";
import JsonViewer from "../common/JsonViewer";

type Tab = "timeline" | "steps" | "io" | "graph";

interface Props {
  workflow: WorkflowRun;
  steps: WorkflowStep[];
}

export default function WorkflowDetail({ workflow, steps }: Props) {
  const [tab, setTab] = useState<Tab>("timeline");
  const durationMs = workflowDurationMs(workflow);
  const fnName = workflow.name.split(".").pop() ?? workflow.name;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-white">{fnName}</h1>
              <WorkflowStatusBadge status={workflow.status} />
            </div>
            <div className="font-mono text-xs text-gray-500" title={workflow.workflow_id}>
              ID: {truncateId(workflow.workflow_id, 32)}
            </div>
            <div className="flex gap-4 text-xs text-gray-500 flex-wrap">
              {workflow.created_at && (
                <span>Started: {formatTimestamp(workflow.created_at)}</span>
              )}
              {durationMs != null && (
                <span>Duration: {formatDuration(durationMs)}</span>
              )}
              {workflow.queue_name && (
                <span>Queue: <span className="text-gray-300">{workflow.queue_name}</span></span>
              )}
              {workflow.executor_id && (
                <span>Executor: <span className="text-gray-300">{workflow.executor_id}</span></span>
              )}
            </div>
          </div>
          <WorkflowActions workflow={workflow} steps={steps} />
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 border-b border-gray-800 mb-4">
          {(["timeline", "steps", "io", "graph"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                tab === t
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              )}
            >
              {t === "timeline"
                ? "Timeline"
                : t === "steps"
                ? "Steps"
                : t === "graph"
                ? "Graph"
                : "Inputs / Outputs"}
            </button>
          ))}
        </div>

        {tab === "timeline" && (
          <WorkflowTimeline workflow={workflow} steps={steps} />
        )}

        {tab === "steps" && (
          <StepsTable steps={steps} />
        )}

        {tab === "io" && (
          <div className="grid grid-cols-2 gap-4">
            <JsonViewer value={workflow.input} label="Input" />
            <JsonViewer
              value={workflow.error ?? workflow.output}
              label={workflow.error ? "Error" : "Output"}
            />
          </div>
        )}

        {tab === "graph" && <WorkflowGraph steps={steps} />}
      </div>
    </div>
  );
}

function StepsTable({ steps }: { steps: WorkflowStep[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (steps.length === 0) {
    return <div className="text-gray-500 text-sm py-8 text-center">No steps recorded yet</div>;
  }

  return (
    <div className="rounded-lg border border-gray-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900 text-left">
            <th className="px-4 py-2 text-gray-400 font-medium w-12">#</th>
            <th className="px-4 py-2 text-gray-400 font-medium">Function</th>
            <th className="px-4 py-2 text-gray-400 font-medium">Status</th>
            <th className="px-4 py-2 text-gray-400 font-medium">Duration</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((step) => (
            <>
              <tr
                key={step.function_id}
                onClick={() => setExpanded(expanded === step.function_id ? null : step.function_id)}
                className="border-b border-gray-800 hover:bg-gray-900 cursor-pointer transition-colors"
              >
                <td className="px-4 py-2 text-gray-500">{step.function_id}</td>
                <td className="px-4 py-2 font-mono text-xs text-gray-200">{step.function_name}</td>
                <td className="px-4 py-2 text-xs">
                  {step.error ? (
                    <span className="text-red-400">Error</span>
                  ) : step.completed_at_epoch_ms ? (
                    <span className="text-green-400">Success</span>
                  ) : (
                    <span className="text-blue-400">Running</span>
                  )}
                </td>
                <td className="px-4 py-2 text-xs text-gray-400">
                  {step.duration_ms != null ? formatDuration(step.duration_ms) : "—"}
                </td>
              </tr>
              {expanded === step.function_id && (
                <tr key={`${step.function_id}-detail`} className="border-b border-gray-800 bg-gray-950">
                  <td />
                  <td colSpan={3} className="px-4 py-3">
                    <JsonViewer
                      value={step.error ?? step.output}
                      label={step.error ? "Error" : "Output"}
                    />
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
