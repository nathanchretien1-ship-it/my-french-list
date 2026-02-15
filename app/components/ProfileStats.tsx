"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b'];

export default function ProfileStats({ items }: { items: any[] }) {
  const stats = items.reduce((acc: any, item: any) => {
    const genre = item.genres?.[0]?.name || "Autre";
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {});

  const data = Object.keys(stats).map(name => ({ name, value: stats[name] }))
    .sort((a, b) => b.value - a.value).slice(0, 5);

  return (
    <div className="h-64 w-full bg-slate-900/30 p-4 rounded-2xl border border-white/5">
      <h3 className="text-xs font-bold text-gray-500 uppercase mb-4">Top Genres</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}