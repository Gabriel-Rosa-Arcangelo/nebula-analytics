import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function AreaTrend({ data }) {
  return (
    <div className="bg-[--color-card] border border-[--color-border] rounded-2xl p-4">
      <div className="mb-2 text-sm opacity-80">Revenue Trend</div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="c1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.8}/>
                <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1F2937" vertical={false}/>
            <XAxis dataKey="label" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip contentStyle={{ background:"#0B0F19", border:"1px solid #1F2937" }}/>
            <Area type="monotone" dataKey="value" stroke="#7C3AED" fill="url(#c1)" strokeWidth={2}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
