// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../api";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Treemap,
} from "recharts";

const PIE_COLORS = ["#7C3AED","#38B2AC","#49BFB7","#3D9BCB","#225C8E","#A78BFA","#60A5FA"];

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [trend, setTrend] = useState([]);
  const [top, setTop] = useState([]);
  const [dist, setDist] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [a,b,c,d] = await Promise.all([
          api.get("/analytics/kpis/"),
          api.get("/analytics/trend/", { params: { days: 30 } }),
          api.get("/analytics/top-products/"),
          api.get("/analytics/distribution/"),
        ]);
        setKpis(a.data);
        setTrend(b.data || []);
        setTop(c.data || []);
        setDist(d.data || []);
      } catch (e) {
        console.error(e);
        setError("Não foi possível carregar os dados (verifique o token e o backend).");
      }
    })();
  }, []);

  // ===== derivations =====
  const trendMA = useMemo(() => addMovingAverage(trend, 7), [trend]);
  const sparkData = useMemo(() => trend.slice(-10), [trend]);

  // radar precisa de um domínio “evenly spaced”, usamos top-products
  const radarData = useMemo(() => {
    if (!top?.length) return [];
    const max = Math.max(...top.map(t => Number(t.value) || 0)) || 1;
    return top.map(t => ({
      subject: t.label,
      value: Number(t.value) || 0,
      norm: (Number(t.value) || 0) / max * 100,
    }));
  }, [top]);

  // treemap precisa de children com size
  const treeData = useMemo(() => ({
    name: "regions",
    children: (dist || []).map((d, i) => ({
      name: d.label,
      size: Math.max(1, Number(d.value) || 0), // evita size=0
      fill: PIE_COLORS[i % PIE_COLORS.length],
    })),
  }), [dist]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        <span className="text-violet-400">Overview</span> — Last 30 days
      </h1>

      {error && (
        <div className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* KPIs + sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Revenue MTD"
          value={kpis ? `$${kpis.revenue_mtd.toLocaleString()}` : "—"}
        >
          <MiniSparkline data={sparkData} stroke="#7C3AED" />
        </KpiCard>
        <KpiCard
          label="Active Users"
          value={kpis ? kpis.active_users.toLocaleString() : "—"}
        >
          <MiniSparkline data={sparkData} stroke="#38B2AC" />
        </KpiCard>
        <KpiCard
          label="Conv. Rate"
          value={kpis ? `${kpis.conv_rate}%` : "—"}
        >
          <MiniSparkline data={sparkData} stroke="#60A5FA" />
        </KpiCard>
        <KpiCard
          label="Open Tickets"
          value={kpis ? kpis.tickets_open : "—"}
        >
          <MiniSparkline data={sparkData} stroke="#A78BFA" />
        </KpiCard>
      </div>

      {/* Linha principal (composed: barras + média móvel) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card title="Revenue Trend (Daily + 7d MA)">
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={trendMA}>
              <defs>
                <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="gridFade" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1f2937" stopOpacity="1" />
                  <stop offset="100%" stopColor="#0b1220" stopOpacity="1" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="label" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip content={<DarkTooltip formatter={(v)=>`$${Number(v).toLocaleString()}`} />} />
              <Bar dataKey="value" fill="url(#barFill)" radius={[4,4,0,0]} />
              <Line type="monotone" dataKey="ma7" stroke="#38B2AC" strokeWidth={2} dot={false}/>
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        {/* Top products list + pie em um card */}
        <Card title="Top Products">
          <div className="grid grid-cols-2 gap-3">
            <ul className="space-y-2">
              {top.map((t,i) => (
                <li key={i} className="flex justify-between text-slate-300">
                  <span>{t.label}</span>
                  <span className="text-slate-400">${Number(t.value).toLocaleString()}</span>
                </li>
              ))}
              {!top.length && <div className="text-slate-500 text-sm">No data.</div>}
            </ul>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={top} dataKey="value" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {top.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<DarkTooltip formatter={(v)=>`$${Number(v).toLocaleString()}`} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Distribuição por região – Treemap */}
        <Card title="Revenue by Region (Treemap)">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={treeData.children || []}
                dataKey="size"
                aspectRatio={4/3}
                stroke="#0f172a"
                fill="#0f172a"
                content={<TreemapNode />}
              />
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Segunda linha de “deep dive” */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Área suave com gradiente (mesmo trend, outra leitura) */}
        <Card title="Smoothed Area (Aesthetic View)">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.35}/>
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="label" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip content={<DarkTooltip formatter={(v)=>`$${Number(v).toLocaleString()}`} />} />
              <Area type="monotone" dataKey="value" stroke="#60A5FA" strokeWidth={2} fill="url(#areaFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Radar (mix por produto normalizado) */}
        <Card title="Product Mix (Radar)">
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1f2937" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Radar name="Mix" dataKey="norm" stroke="#A78BFA" fill="#A78BFA" fillOpacity={0.35} />
              <Tooltip content={<DarkTooltip formatter={(v)=>`${Number(v).toFixed(0)}%`} />} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

/* ============ helpers & small components ============ */

function Card({title, children}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow">
      <div className="text-sm text-violet-300 mb-3">{title}</div>
      {children}
    </div>
  );
}

function KpiCard({label, value, children}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
          <div className="text-2xl font-semibold text-slate-100 mt-2">{value}</div>
        </div>
        <div className="w-28 h-12 -mt-2">{children}</div>
      </div>
    </div>
  );
}

// Mini sparkline para os KPIs
function MiniSparkline({ data, stroke="#7C3AED" }) {
  if (!data?.length) return null;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line type="monotone" dataKey="value" stroke={stroke} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Tooltip dark consistente
function DarkTooltip({ active, payload, label, formatter }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 text-xs text-slate-200 backdrop-blur">
        {label && <div className="mb-1 text-slate-400">{label}</div>}
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-300">{p.name || p.dataKey}:</span>
            <span className="text-slate-100">
              {formatter ? formatter(p.value) : String(p.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

// Treemap node customizado (dark + label)
function TreemapNode(props) {
  const { x, y, width, height, name, fill } = props;
  if (width < 60 || height < 30) {
    return <g />;
  }
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} style={{ fill, stroke: "#0f172a", strokeWidth: 1 }} rx={8} />
      <text x={x + 10} y={y + 22} fill="#E2E8F0" fontSize={12}>{name}</text>
    </g>
  );
}

// adiciona média móvel n-dias à série [{label, value}]
function addMovingAverage(arr, window = 7) {
  if (!arr?.length) return [];
  const values = arr.map(d => Number(d.value) || 0);
  const out = arr.map((d, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    const avg = slice.reduce((a,b)=>a+b,0) / slice.length;
    return { ...d, ma7: avg };
  });
  return out;
}

