import { NavLink } from "react-router-dom";
import clsx from "clsx";

const links = [
  { to: "/workflows", label: "Workflow Runs" },
  { to: "/queues", label: "Queues" },
];

export default function Sidebar() {
  return (
    <aside className="w-52 bg-gray-900 border-r border-gray-800 flex flex-col p-4 shrink-0">
      <div className="mb-6">
        <div className="text-base font-bold text-white">DBOS Dashboard</div>
        <div className="text-xs text-gray-500 mt-0.5">Workflow Operations</div>
      </div>
      <nav className="space-y-1">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                "block px-3 py-2 rounded text-sm transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
