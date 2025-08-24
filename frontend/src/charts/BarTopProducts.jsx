import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function BarTopProducts({ data }) {
  return (
    <div className="bg-[--color-card] border border-[--color-border] rounded-2xl p-4">
      <div className="mb-2 text-sm opacity-80">Top Products</div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="#1F2937" vertical={false}/>
            <XAxis dataKey="label" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip contentStyle={{ background:"#0B0F19", border:"1px solid #1F2937" }}/>
            <Bar dataKey="value" fill="#38B2AC" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
