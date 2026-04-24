import { useState } from "react";
import clsx from "clsx";
import { useWorkflows } from "../hooks/useWorkflows";
import WorkflowTable from "../components/workflows/WorkflowTable";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Running" },
  { value: "ENQUEUED", label: "Queued" },
  { value: "DELAYED", label: "Delayed" },
  { value: "SUCCESS", label: "Success" },
  { value: "ERROR", label: "Error" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "MAX_RECOVERY_ATTEMPTS_EXCEEDED", label: "Max Retries" },
];

type TimespanPreset = "30m" | "8h" | "24h" | "7d" | "all" | "custom";

const PRESETS: { value: TimespanPreset; label: string }[] = [
  { value: "30m",    label: "30m"    },
  { value: "8h",     label: "8h"     },
  { value: "24h",    label: "24h"    },
  { value: "7d",     label: "7d"     },
  { value: "all",    label: "All"    },
  { value: "custom", label: "Custom" },
];

const PRESET_MS: Record<string, number> = {
  "30m": 30 * 60_000,
  "8h":  8  * 3_600_000,
  "24h": 24 * 3_600_000,
  "7d":  7  * 86_400_000,
};

function timespanFilters(preset: TimespanPreset, customStart: string, customEnd: string) {
  if (preset === "all") return {};
  if (preset === "custom") {
    return {
      start_time: customStart ? new Date(customStart).toISOString() : undefined,
      end_time:   customEnd   ? new Date(customEnd).toISOString()   : undefined,
    };
  }
  return { start_time_ms_ago: PRESET_MS[preset] };
}

const PAGE_SIZE = 50;

export default function WorkflowsPage() {
  const [status, setStatus] = useState("");
  const [name, setName] = useState("");
  const [queue, setQueue] = useState("");
  const [page, setPage] = useState(0);

  const [preset, setPreset] = useState<TimespanPreset>("8h");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const { data, isLoading, isError, error } = useWorkflows({
    ...timespanFilters(preset, customStart, customEnd),
    status: status || undefined,
    name: name || undefined,
    queue_name: queue || undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const handleFilterChange = (setter: (v: string) => void) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setter(e.target.value);
      setPage(0);
    };

  const clearAll = () => {
    setStatus(""); setName(""); setQueue("");
    setPreset("8h"); setCustomStart(""); setCustomEnd("");
    setPage(0);
  };

  const hasActiveFilters = Boolean(status || name || queue || preset !== "8h");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Workflow Runs</h2>
        {data && (
          <span className="text-xs text-gray-500">
            {data.length} result{data.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex gap-3 flex-wrap items-center">
          {/* Timespan picker */}
          <div className="flex rounded border border-gray-700 overflow-hidden text-xs">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => { setPreset(p.value); setPage(0); }}
                className={clsx(
                  "px-2.5 py-1.5 transition-colors",
                  preset === p.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <select
            value={status}
            onChange={handleFilterChange(setStatus)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Filter by workflow name…"
            value={name}
            onChange={handleFilterChange(setName)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 w-56"
          />

          <input
            type="text"
            placeholder="Filter by queue name…"
            value={queue}
            onChange={handleFilterChange(setQueue)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 w-48"
          />

          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="text-xs text-gray-400 hover:text-gray-200 px-2"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Custom range inputs */}
        {preset === "custom" && (
          <div className="flex gap-2 items-center text-xs text-gray-400">
            <input
              type="datetime-local"
              value={customStart}
              onChange={(e) => { setCustomStart(e.target.value); setPage(0); }}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-gray-200 focus:outline-none focus:border-blue-500"
            />
            <span>→</span>
            <input
              type="datetime-local"
              value={customEnd}
              onChange={(e) => { setCustomEnd(e.target.value); setPage(0); }}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-gray-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}
      </div>

      {isLoading && (
        <div className="text-gray-500 text-sm py-8 text-center">Loading…</div>
      )}

      {isError && (
        <div className="text-red-400 text-sm py-4">
          Error: {String(error)}
        </div>
      )}

      {data && <WorkflowTable workflows={data} />}

      {/* Pagination */}
      {data && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <span className="text-xs text-gray-500">Page {page + 1}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={data.length < PAGE_SIZE}
            className="px-3 py-1.5 rounded text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
