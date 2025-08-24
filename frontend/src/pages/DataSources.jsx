// src/pages/DataSources.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../api";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

const STATUS_COLORS = {
  connected: "#10B981",     // emerald
  degraded: "#F59E0B",      // amber
  disconnected: "#EF4444",  // red
  unknown: "#A78BFA",       // violet
};

export default function DataSources() {
  const [rows, setRows] = useState([]);
  const [name, setName] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/datasources/");
      setRows(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(console.error); }, []);

  // polling leve quando existir algo que não está connected
  useEffect(() => {
    if (!autoRefresh) return;
    const hasUnstable = rows.some(r => (r.status || "").toLowerCase() !== "connected");
    if (!hasUnstable) return;
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [rows, autoRefresh]);

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await api.post("/datasources/", { name, type: "api", status: "connected" });
    setName("");
    await load();
  };

  // ===== Derivados / filtros =====
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      const s = (r.status || "").toLowerCase();
      const t = (r.type || "").toLowerCase();
      const bySearch = !q || r.name.toLowerCase().includes(q) || t.includes(q);
      const byStatus = statusFilter === "all" || s === statusFilter;
      const byType = typeFilter === "all" || t === typeFilter;
      return bySearch && byStatus && byType;
    });
  }, [rows, search, statusFilter, typeFilter]);

  const counts = useMemo(() => {
    const acc = { connected: 0, degraded: 0, disconnected: 0, unknown: 0 };
    rows.forEach(r => {
      const key = (r.status || "unknown").toLowerCase();
      if (acc[key] === undefined) acc.unknown += 1; else acc[key] += 1;
    });
    return acc;
  }, [rows]);

  const pieData = useMemo(() => {
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ name: k, value: v, color: STATUS_COLORS[k] || "#A78BFA" }));
  }, [counts]);

  const typesAgg = useMemo(() => {
    const m = {};
    rows.forEach(r => {
      const t = (r.type || "other").toLowerCase();
      m[t] = (m[t] || 0) + 1;
    });
    return Object.entries(m).map(([type, count]) => ({ type, count }));
  }, [rows]);

  const total = rows.length;
  const healthy = counts.connected;
  const unstable = counts.degraded + counts.disconnected + counts.unknown;

  // opções de tipo a partir dos dados
  const typeOptions = useMemo(() => {
    const set = new Set(rows.map(r => (r.type || "other").toLowerCase()));
    return ["all", ...Array.from(set)];
  }, [rows]);

  return (
    <div className="space-y-6">
      {/* Header + actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Data Sources</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 accent-violet-600"
            />
            Auto‑refresh
          </label>
          <button
            onClick={load}
            disabled={loading}
            className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <form onSubmit={add} className="flex gap-2">
            <input
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 w-64"
              placeholder="New source name"
              value={name}
              onChange={(e)=>setName(e.target.value)}
            />
            <button className="px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500">Add</button>
          </form>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input
          className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 w-full md:w-72"
          placeholder="Search by name or type…"
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
        />
        <select
          className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 w-full md:w-48"
          value={statusFilter}
          onChange={(e)=>setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="connected">Connected</option>
          <option value="degraded">Degraded</option>
          <option value="disconnected">Disconnected</option>
          <option value="unknown">Unknown</option>
        </select>
        <select
          className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 w-full md:w-48"
          value={typeFilter}
          onChange={(e)=>setTypeFilter(e.target.value)}
        >
          {typeOptions.map(opt => <option key={opt} value={opt}>{opt[0].toUpperCase()+opt.slice(1)}</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Total" value={total} />
        <SummaryCard label="Connected" value={healthy} tone="emerald" />
        <SummaryCard label="Unstable" value={unstable} tone="amber" />
        <SummaryCard label="Unknown" value={counts.unknown} tone="violet" />
      </div>

      {/* Grid: Tabela + Visuais */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Tabela (2 colunas em telas grandes) */}
        <div className="xl:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-slate-400 border-b border-slate-800">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-slate-800/60">
                  <td className="p-3">{r.id}</td>
                  <td className="p-3">{r.name}</td>
                  <td className="p-3"><TypeBadge type={r.type} /></td>
                  <td className="p-3"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td className="p-3 text-slate-500" colSpan={4}>No data sources.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Visuais */}
        <div className="space-y-6">
          <Card title="Status Distribution">
            {pieData.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {pieData.map((d, idx) => <Cell key={idx} fill={d.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "rgba(15,23,42,0.95)", border: "1px solid #1f2937", borderRadius: 8 }}
                    labelClassName="text-slate-300"
                    itemStyle={{ color: "#e2e8f0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyHint />
            )}
          </Card>

          <Card title="Sources by Type">
            {typesAgg.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={typesAgg}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="type" stroke="#94a3b8" />
                  <YAxis allowDecimals={false} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ background: "rgba(15,23,42,0.95)", border: "1px solid #1f2937", borderRadius: 8 }}
                    labelClassName="text-slate-300"
                    itemStyle={{ color: "#e2e8f0" }}
                  />
                  <Bar dataKey="count" radius={[6,6,0,0]} fill="#7C3AED" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyHint />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ===== subcomponents ===== */

function Card({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow">
      <div className="text-sm text-violet-300 mb-3">{title}</div>
      {children}
    </div>
  );
}

function SummaryCard({ label, value, tone = "slate" }) {
  const toneMap = {
    slate: "text-slate-300 border-slate-800",
    emerald: "text-emerald-300 border-emerald-900/30",
    amber: "text-amber-300 border-amber-900/30",
    violet: "text-violet-300 border-violet-900/30",
  };
  return (
    <div className={`rounded-xl border bg-slate-900/60 p-4 ${toneMap[tone]}`}>
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-2xl font-semibold text-slate-100 mt-2">{value}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = (status || "unknown").toLowerCase();
  const cls = {
    connected: "bg-emerald-900/40 text-emerald-300 border-emerald-800",
    degraded: "bg-amber-900/40 text-amber-300 border-amber-800",
    disconnected: "bg-red-900/40 text-red-300 border-red-800",
    unknown: "bg-violet-900/40 text-violet-300 border-violet-800",
  }[s] || "bg-slate-800 text-slate-300 border-slate-700";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status || "unknown"}
    </span>
  );
}

function TypeBadge({ type }) {
  const t = (type || "other").toLowerCase();
  const map = {
    api: "bg-sky-900/40 text-sky-300 border-sky-800",
    db: "bg-indigo-900/40 text-indigo-300 border-indigo-800",
    s3: "bg-fuchsia-900/40 text-fuchsia-300 border-fuchsia-800",
    other: "bg-slate-800 text-slate-300 border-slate-700",
  };
  const cls = map[t] || map.other;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs ${cls}`}>
      {type || "other"}
    </span>
  );
}

function EmptyHint() {
  return <div className="text-slate-500 text-sm">No data.</div>;
}
