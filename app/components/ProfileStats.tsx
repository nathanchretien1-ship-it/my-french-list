"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b'];

interface ProfileStatsProps {
  items: any[];
}

export default function ProfileStats({ items }: ProfileStatsProps) {
  if (!items || items.length === 0) return null;

  // Calcul de la répartition par genre (ex: Action: 5, Romance: 2)
  const stats = items.reduce((acc: any, item: any) => {
    // Si l'anime n'a pas de genre, on le classe dans "Autre"
    const genre = item.genres?.[0]?.name || "Autre";
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {});

  // Transformation en tableau pour Recharts et tri par popularité
  const data = Object.keys(stats)
    .map(name => ({ name, value: stats[name] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // On garde le Top 5

  return (
    <div className="h-full min-h-[250px] w-full bg-[#1e293b]/30 p-4 rounded-2xl border border-white/5 flex flex-col">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">Top Genres</h3>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}