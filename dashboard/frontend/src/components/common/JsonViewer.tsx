interface JsonViewerProps {
  value: unknown;
  label?: string;
}

export default function JsonViewer({ value, label }: JsonViewerProps) {
  if (value === null || value === undefined) {
    return (
      <div className="text-gray-500 text-sm italic">
        {label && <div className="text-gray-400 font-medium mb-1">{label}</div>}
        None
      </div>
    );
  }

  let display: string;
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    display = JSON.stringify(parsed, null, 2);
  } catch {
    display = typeof value === "string" ? value : String(value);
  }

  return (
    <div>
      {label && <div className="text-gray-400 text-sm font-medium mb-2">{label}</div>}
      <pre className="bg-gray-900 border border-gray-700 rounded p-3 text-xs text-green-300 overflow-auto max-h-64 whitespace-pre-wrap break-all">
        {display}
      </pre>
    </div>
  );
}
