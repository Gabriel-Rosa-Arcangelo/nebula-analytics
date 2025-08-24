import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#38B2AC", "#49BFB7", "#3D9BCB", "#2F78AD", "#225C8E"];

export default function PieDistribution({ data }) {
  return (
    <div className="bg-[--color-card] border border-[--color-border] rounded-2xl p-4">
      <div className="mb-2 text-sm opacity-80">Distribution</div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={90}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background:"#0B0F19", border:"1px solid #1F2937" }}/>
            <Legend wrapperStyle={{ color:"#E5E7EB" }}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
