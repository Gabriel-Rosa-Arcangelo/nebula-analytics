// src/pages/Reports.jsx
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
  done: "#38B2AC",
  queued: "#7C3AED",
  processing: "#60A5FA",
  failed: "#EF4444",
};

export default function Reports() {
  const [rows, setRows] = useState([]);
  const [creating, setCreating] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/reports/");
      setRows(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // polling enquanto tiver itens != done
  useEffect(() => {
    if (!autoRefresh) return;
    const hasPending = rows.some(r => r.status !== "done");
    if (!hasPending) return;
    const id = setInterval(fetchReports, 3000);
    return () => clearInterval(id);
  }, [rows, autoRefresh]);

  const createReport = async () => {
    try {
      setCreating(true);
      const { data } = await api.post("/reports/", { title: "Ad-hoc Revenue Report" });
      setRows(prev => [data, ...prev]);
    } finally {
      setCreating(false);
    }
  };

  // ======= Derivações p/ visuais =======
  const statusCounts = useMemo(() => {
    const m = { done: 0, queued: 0, processing: 0, failed: 0 };
    rows.forEach(r => {
      const key = (r.status || "").toLowerCase();
      if (m[key] !== undefined) m[key] += 1;
    });
    return m;
  }, [rows]);

  const pieData = useMemo(() => {
    return Object.entries(statusCounts)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ name: k, value: v, color: STATUS_COLORS[k] || "#A78BFA" }));
  }, [statusCounts]);

  const barData = useMemo(() => {
    // pequena agregação por status em formato amigável
    return [
      { status: "done", count: statusCounts.done },
      { status: "queued", count: statusCounts.queued },
      { status: "processing", count: statusCounts.processing },
      { status: "failed", count: statusCounts.failed },
    ].filter(d => d.count > 0);
  }, [statusCounts]);

  const total = rows.length;

  return (
    <div className="space-y-6">
      {/* Header + actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Reports</h1>
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
            onClick={fetchReports}
            disabled={loading}
            className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button
            onClick={createReport}
            disabled={creating}
            className="px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50"
          >
            {creating ? "Queuing..." : "New Report"}
          </button>
        </div>
      </div>

      {/* KPIs de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Total" value={total} />
        <SummaryCard label="Done" value={statusCounts.done} tone="emerald" />
        <SummaryCard label="Queued/Proc." value={statusCounts.queued + statusCounts.processing} tone="violet" />
        <SummaryCard label="Failed" value={statusCounts.failed} tone="red" />
      </div>

      {/* Grid inferior: Tabela + Visualizações */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Tabela ocupa 2 colunas em telas grandes */}
        <div className="xl:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-slate-400 border-b border-slate-800">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Link</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-slate-800/60">
                  <td className="p-3">{r.id}</td>
                  <td className="p-3">{r.title}</td>
                  <td className="p-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="p-3">
                    {r.url ? (
                      <a className="text-violet-300 underline" href={r.url} target="_blank" rel="noreferrer">Open</a>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td className="p-3 text-slate-500" colSpan={4}>No reports yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Visuais (pizza + barras) */}
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

          <Card title="Counts by Status">
            {barData.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="status" stroke="#94a3b8" />
                  <YAxis allowDecimals={false} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ background: "rgba(15,23,42,0.95)", border: "1px solid #1f2937", borderRadius: 8 }}
                    labelClassName="text-slate-300"
                    itemStyle={{ color: "#e2e8f0" }}
                  />
                  <Bar dataKey="count" radius={[6,6,0,0]}>
                    {barData.map((d, idx) => (
                      <Cell key={idx} fill={STATUS_COLORS[d.status] || "#A78BFA"} />
                    ))}
                  </Bar>
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

/* ======= subcomponents ======= */

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
    violet: "text-violet-300 border-violet-900/30",
    red: "text-red-300 border-red-900/30",
  };
  return (
    <div className={`rounded-xl border bg-slate-900/60 p-4 ${toneMap[tone]}`}>
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-2xl font-semibold text-slate-100 mt-2">{value}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  const styles = {
    done: "bg-emerald-900/40 text-emerald-300 border-emerald-800",
    queued: "bg-violet-900/40 text-violet-300 border-violet-800",
    processing: "bg-sky-900/40 text-sky-300 border-sky-800",
    failed: "bg-red-900/40 text-red-300 border-red-800",
  }[s] || "bg-slate-800 text-slate-300 border-slate-700";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs ${styles}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function EmptyHint() {
  return <div className="text-slate-500 text-sm">No data.</div>;
}
