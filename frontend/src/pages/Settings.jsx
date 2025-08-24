// src/pages/Settings.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../api";

export default function Settings() {
  const [cfg, setCfg] = useState(null);
  const [saving, setSaving] = useState(false);

  // Front-only
  const [demoToken, setDemoToken] = useState(localStorage.getItem("nebula_token") || "");
  const [probe, setProbe] = useState({ status: "idle", ms: null, error: "" });

  useEffect(() => {
    (async () => {
      const { data } = await api.get("/settings/");
      // defaults visuais sem quebrar stub
      setCfg({
        theme: data.theme ?? "dark",
        accent: data.accent ?? "#7C3AED",
        refresh_seconds: data.refresh_seconds ?? 60,
        org_name: data.org_name ?? "Nebula Analytics",
        logo_url: data.logo_url ?? "",
        density: data.density ?? "comfortable",
        default_range_days: data.default_range_days ?? 30,
        number_locale: data.number_locale ?? "en-US",
        date_locale: data.date_locale ?? "en-US",
        slack_webhook: data.slack_webhook ?? "",
        cors_origins: data.cors_origins ?? "http://localhost:5173",
      });
    })().catch(console.error);
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.post("/settings/", cfg);
      setCfg(data);
    } finally {
      setSaving(false);
    }
  };

  const saveToken = () => {
    if (!demoToken.trim()) return;
    localStorage.setItem("nebula_token", demoToken.trim());
    alert("Token salvo no navegador.");
  };

  const clearToken = () => {
    localStorage.removeItem("nebula_token");
    setDemoToken("");
    alert("Token removido do navegador.");
  };

  const clearLocalCache = () => {
    // preserve token se existir
    const token = localStorage.getItem("nebula_token");
    localStorage.clear();
    if (token) localStorage.setItem("nebula_token", token);
    alert("Cache local limpo (exceto token).");
  };

  const probeBackend = async () => {
    setProbe({ status: "loading", ms: null, error: "" });
    const t0 = performance.now();
    try {
      const base = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
      const headers = demoToken ? { Authorization: `Bearer ${demoToken}` } : {};
      const res = await fetch(`${base}/api/analytics/kpis/`, { headers });
      const t1 = performance.now();
      if (!res.ok) {
        const errText = await res.text();
        setProbe({ status: "error", ms: Math.round(t1 - t0), error: `${res.status} ${res.statusText}: ${errText.slice(0, 140)}` });
        return;
      }
      setProbe({ status: "ok", ms: Math.round(t1 - t0), error: "" });
    } catch (e) {
      const t1 = performance.now();
      setProbe({ status: "error", ms: Math.round(t1 - t0), error: String(e?.message || e) });
    }
  };

  const previewStyle = useMemo(() => ({
    background: cfg?.theme === "light" ? "linear-gradient(90deg,#ffffff,#f3f4f6)" : "linear-gradient(90deg,#0B0F19,#111827)",
    borderColor: cfg?.theme === "light" ? "#e5e7eb" : "#1f2937",
  }), [cfg?.theme]);

  if (!cfg) return <div>Loading…</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {/* Live Preview */}
      <div className="rounded-xl border p-0 overflow-hidden" style={{ borderColor: previewStyle.borderColor }}>
        <div className="p-4" style={previewStyle}>
          <div className="flex items-center gap-3">
            {cfg.logo_url ? (
              <img src={cfg.logo_url} alt="logo" className="h-8 w-8 rounded-lg object-cover border border-slate-700" />
            ) : (
              <div className="h-8 w-8 rounded-lg border border-slate-700 grid place-items-center" style={{ background: "#0F172A" }}>
                <span style={{ color: cfg.accent }}>★</span>
              </div>
            )}
            <div className="text-slate-200 font-medium" style={{ color: cfg.theme === "light" ? "#0f172a" : "#e2e8f0" }}>
              {cfg.org_name}
            </div>
            <div className="ml-auto text-xs" style={{ color: cfg.accent }}>accent</div>
          </div>
        </div>
      </div>

      {/* Branding */}
      <Card title="Branding">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Organization name">
            <input
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 w-full"
              value={cfg.org_name}
              onChange={(e)=>setCfg({ ...cfg, org_name: e.target.value })}
            />
          </Field>
          <Field label="Logo URL">
            <input
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 w-full"
              placeholder="https://…/logo.png"
              value={cfg.logo_url}
              onChange={(e)=>setCfg({ ...cfg, logo_url: e.target.value })}
            />
          </Field>
          <Field label="Accent color (hex)">
            <input
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 w-full"
              value={cfg.accent}
              onChange={(e)=>setCfg({ ...cfg, accent: e.target.value })}
            />
          </Field>
        </div>
      </Card>

      {/* Aparência */}
      <Card title="Appearance">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Theme">
            <select
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 w-full"
              value={cfg.theme}
              onChange={(e)=>setCfg({ ...cfg, theme: e.target.value })}
            >
              <option value="dark">dark</option>
              <option value="light">light</option>
            </select>
          </Field>
          <Field label="Density">
            <select
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 w-full"
              value={cfg.density}
              onChange={(e)=>setCfg({ ...cfg, density: e.target.value })}
            >
              <option value="comfortable">comfortable</option>
              <option value="compact">compact</option>
            </select>
          </Field>
          <Field label="Default range (days)">
            <input
              type="number"
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 w-full"
              value={cfg.default_range_days}
              onChange={(e)=>setCfg({ ...cfg, default_range_days: Number(e.target.value) })}
            />
          </Field>
        </div>
      </Card>

      {/* Comportamento */}
      <Card title="Behavior">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Auto-refresh (seconds)">
            <input
              type="number"
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 w-full"
              value={cfg.refresh_seconds}
              onChange={(e)=>setCfg({ ...cfg, refresh_seconds: Number(e.target.value) })}
            />
          </Field>
          <Field label="Number locale (Intl)">
            <input
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 w-full"
              placeholder="ex: en-US, pt-BR"
              value={cfg.number_locale}
              onChange={(e)=>setCfg({ ...cfg, number_locale: e.target.value })}
            />
          </Field>
          <Field label="Date locale (Intl)">
            <input
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 w-full"
              placeholder="ex: en-US, pt-BR"
              value={cfg.date_locale}
              onChange={(e)=>setCfg({ ...cfg, date_locale: e.target.value })}
            />
          </Field>
        </div>
      </Card>

      {/* Integrações */}
      <Card title="Integrations">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Slack webhook (optional)">
            <input
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 w-full"
              placeholder="https://hooks.slack.com/services/…"
              value={cfg.slack_webhook}
              onChange={(e)=>setCfg({ ...cfg, slack_webhook: e.target.value })}
            />
          </Field>
        </div>
      </Card>

      {/* Segurança */}
      <Card title="Security">
        <Field label="CORS Allowed Origins (one per line)">
          <textarea
            rows={4}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 w-full"
            value={cfg.cors_origins}
            onChange={(e)=>setCfg({ ...cfg, cors_origins: e.target.value })}
          />
        </Field>
      </Card>

      {/* Token & Diagnostic */}
      <Card title="Demo Token (JWT) & Diagnostics">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-3">
            <Field label="JWT access token (stored in browser)">
              <textarea
                rows={4}
                className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 w-full font-mono text-xs"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={demoToken}
                onChange={(e)=>setDemoToken(e.target.value)}
              />
            </Field>
            <div className="flex gap-2">
              <button onClick={saveToken} className="px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500">
                Save token
              </button>
              <button onClick={clearToken} className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800">
                Clear token
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-slate-400">Backend probe</div>
            <button onClick={probeBackend} className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500">
              Test /analytics/kpis
            </button>
            <ProbeStatus probe={probe} />
            <button onClick={clearLocalCache} className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800">
              Clear local cache
            </button>
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

/* ===== subcomponents ===== */

function Card({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow space-y-4">
      <div className="text-sm text-violet-300">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function ProbeStatus({ probe }) {
  if (!probe) return null;
  const { status, ms, error } = probe;
  const badge = {
    idle:  { cls: "bg-slate-800 text-slate-300 border-slate-700", text: "idle" },
    loading: { cls: "bg-sky-900/40 text-sky-300 border-sky-800", text: "testing…" },
    ok: { cls: "bg-emerald-900/40 text-emerald-300 border-emerald-800", text: `ok ${ms ?? 0}ms` },
    error: { cls: "bg-red-900/40 text-red-300 border-red-800", text: `error ${ms ?? 0}ms` },
  }[status] || { cls: "bg-slate-800 text-slate-300 border-slate-700", text: "idle" };

  return (
    <div className="space-y-2">
      <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${badge.cls}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {badge.text}
      </span>
      {status === "error" && (
        <div className="text-xs text-red-300/90 break-all bg-red-950/30 border border-red-900/40 rounded p-2">
          {error}
        </div>
      )}
    </div>
  );
}
