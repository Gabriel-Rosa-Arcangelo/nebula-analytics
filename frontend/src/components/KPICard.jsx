export default function KPICard({ label, value, delta, accent = "purple" }) {
    const color = accent === "purple" ? "bg-[--color-purple]" : "bg-[--color-cyan]";
    const trendColor = (delta ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400";
    const sign = (delta ?? 0) >= 0 ? "▲" : "▼";
  
    return (
      <div className="bg-[--color-card] border border-[--color-border] rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${color} opacity-90`} />
          <div>
            <div className="text-xs opacity-60">{label}</div>
            <div className="text-xl font-semibold">{value}</div>
          </div>
          <div className={`ml-auto text-xs ${trendColor}`}>{sign} {Math.abs(delta ?? 0)}%</div>
        </div>
      </div>
    );
  }
  