import "@xyflow/react/dist/style.css";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
} from "@xyflow/react";
import clsx from "clsx";
import type { WorkflowStep } from "../../types/dbos";
import { formatDuration } from "../../lib/format";

interface Props {
  steps: WorkflowStep[];
}

const STEP_W = 220;
const STEP_H = 64;
const GAP_Y = 40;
const CHILD_OFFSET_X = 280;

export default function WorkflowGraph({ steps }: Props) {
  if (steps.length === 0) {
    return (
      <div className="text-gray-500 text-sm py-8 text-center">
        No steps recorded yet
      </div>
    );
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  steps.forEach((step, i) => {
    const y = i * (STEP_H + GAP_Y);
    const isError = Boolean(step.error);
    const isRunning = !step.completed_at_epoch_ms && !step.error;
    const shortName = step.function_name.split(".").pop() ?? step.function_name;

    nodes.push({
      id: String(step.function_id),
      position: { x: 0, y },
      data: {
        label: (
          <div className="text-left px-3 py-2 space-y-0.5">
            <div className="flex items-center gap-2">
              <span
                className={clsx(
                  "w-2 h-2 rounded-full shrink-0",
                  isError
                    ? "bg-red-500"
                    : isRunning
                    ? "bg-blue-400 animate-pulse"
                    : "bg-green-500"
                )}
              />
              <span
                className="font-mono text-xs truncate"
                title={step.function_name}
              >
                #{step.function_id} {shortName}
              </span>
            </div>
            {step.duration_ms != null && (
              <div className="text-xs text-gray-400 pl-4">
                {formatDuration(step.duration_ms)}
              </div>
            )}
          </div>
        ),
      },
      style: {
        width: STEP_W,
        background: isError ? "#3f1515" : isRunning ? "#13284f" : "#162813",
        border: `1px solid ${isError ? "#7f1d1d" : isRunning ? "#1d4ed8" : "#166534"}`,
        borderRadius: 8,
        padding: 0,
        color: "#e5e7eb",
      },
    });

    if (i < steps.length - 1) {
      edges.push({
        id: `e${step.function_id}-${steps[i + 1].function_id}`,
        source: String(step.function_id),
        target: String(steps[i + 1].function_id),
        style: { stroke: "#4b5563" },
      });
    }

    if (step.child_workflow_id) {
      const childId = `child-${step.function_id}`;
      const shortChild = step.child_workflow_id.slice(0, 8) + "…";
      nodes.push({
        id: childId,
        position: { x: CHILD_OFFSET_X, y: y + (STEP_H - 36) / 2 },
        data: {
          label: (
            <a
              href={`/workflows/${step.child_workflow_id}`}
              className="block px-3 py-2 text-xs font-mono text-blue-400 hover:text-blue-300"
              title={step.child_workflow_id}
            >
              &#8618; {shortChild}
            </a>
          ),
        },
        style: {
          width: 160,
          background: "#1e1b4b",
          border: "1px solid #3730a3",
          borderRadius: 8,
          padding: 0,
          color: "#c7d2fe",
        },
      });
      edges.push({
        id: `ec-${step.function_id}`,
        source: String(step.function_id),
        target: childId,
        style: { stroke: "#3730a3", strokeDasharray: "4 2" },
      });
    }
  });

  return (
    <div
      style={
        {
          height: Math.max(400, steps.length * (STEP_H + GAP_Y) + 80),
          "--xy-controls-button-background-color": "#1f2937",
          "--xy-controls-button-background-color-hover": "#374151",
          "--xy-controls-button-border-color": "#4b5563",
          "--xy-controls-button-color": "#d1d5db",
        } as React.CSSProperties
      }
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#374151" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
