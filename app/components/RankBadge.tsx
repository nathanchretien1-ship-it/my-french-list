import { getRank } from "../lib/ranks";

// 👇 On ajoute la prop 'admin'
export default function RankBadge({ count, admin = false, small = false }: { count: number, admin?: boolean, small?: boolean }) {
  const rank = getRank(count, admin);

  if (small) {
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm ${rank.color}`}>
        {rank.title}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full font-bold shadow-lg w-fit ${rank.color}`}>
      <span className="text-lg">{rank.emoji}</span>
      <span className="text-sm uppercase tracking-wider">{rank.title}</span>
    </div>
  );
}