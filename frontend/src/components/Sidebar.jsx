import { NavLink } from "react-router-dom";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: "📈" },
  { to: "/reports", label: "Reports", icon: "🧾" },
  { to: "/datasources", label: "Data Sources", icon: "🔌" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900/80 border-r border-slate-800 hidden md:flex flex-col">
      <div className="h-16 flex items-center px-4 border-b border-slate-800">
        <div className="text-xl font-semibold">
          <span className="text-violet-400">Nebula</span> Analytics
        </div>
      </div>
      <nav className="p-3 space-y-1">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition 
               ${isActive ? "bg-violet-600/20 text-violet-300" : "hover:bg-slate-800/60 text-slate-300"}`
            }
          >
            <span className="text-lg">{it.icon}</span>
            <span>{it.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto p-3 text-xs text-slate-500">
        <div className="font-mono break-all">
          API: {import.meta.env.VITE_API_BASE || "unset"}
        </div>
      </div>
    </aside>
  );
}
