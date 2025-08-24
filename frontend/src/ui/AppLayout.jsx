import { NavLink, Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-4">
        <div className="text-xl font-bold text-violet-400 mb-6">Nebula Analytics</div>
        <nav className="space-y-2">
          <NavLink to="/" end className={({isActive}) => `block px-3 py-2 rounded ${isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800"}`}>Dashboard</NavLink>
          <NavLink to="/reports" className={({isActive}) => `block px-3 py-2 rounded ${isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800"}`}>Reports</NavLink>
          <NavLink to="/data-sources" className={({isActive}) => `block px-3 py-2 rounded ${isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800"}`}>Data Sources</NavLink>
          <NavLink to="/settings" className={({isActive}) => `block px-3 py-2 rounded ${isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800"}`}>Settings</NavLink>
        </nav>
      </aside>
      <main className="flex-1">
        <header className="h-14 border-b border-slate-800 flex items-center px-6 justify-between">
          <div className="text-slate-300">Portfolio Edition</div>
          <div className="text-slate-400 text-sm">Dark · Blue · Clean</div>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
